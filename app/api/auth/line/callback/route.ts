import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

interface LineTokenResponse {
  access_token: string
  token_type: string
  refresh_token: string
  expires_in: number
  scope: string
  id_token: string
}

interface LineProfile {
  userId: string
  displayName: string
  pictureUrl?: string
  statusMessage?: string
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || origin

  // 處理 LINE 錯誤
  if (error) {
    console.error('LINE OAuth error:', error, errorDescription)
    return NextResponse.redirect(
      `${appUrl}/auth/login?error=${encodeURIComponent(errorDescription || error)}`
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(`${appUrl}/auth/login?error=missing_params`)
  }

  const cookieStore = await cookies()
  const savedState = cookieStore.get('line_oauth_state')?.value
  const savedNonce = cookieStore.get('line_oauth_nonce')?.value

  // 驗證 state（CSRF 保護）
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(`${appUrl}/auth/login?error=invalid_state`)
  }

  // 清除 OAuth state cookies
  cookieStore.delete('line_oauth_state')
  cookieStore.delete('line_oauth_nonce')

  try {
    // 1. 用 code 換取 access_token 和 id_token
    const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${appUrl}/api/auth/line/callback`,
        client_id: process.env.LINE_CHANNEL_ID!,
        client_secret: process.env.LINE_CHANNEL_SECRET!,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('LINE token exchange failed:', errorData)
      return NextResponse.redirect(`${appUrl}/auth/login?error=token_exchange_failed`)
    }

    const tokenData: LineTokenResponse = await tokenResponse.json()

    // 2. 取得用戶資料
    const profileResponse = await fetch('https://api.line.me/v2/profile', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })

    if (!profileResponse.ok) {
      console.error('LINE profile fetch failed')
      return NextResponse.redirect(`${appUrl}/auth/login?error=profile_fetch_failed`)
    }

    const profile: LineProfile = await profileResponse.json()

    // 3. 嘗試使用 signInWithIdToken（如果 Supabase 支援 LINE）
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // 忽略
            }
          },
        },
      }
    )

    // 嘗試用 ID Token 登入（需要在 Supabase Dashboard 配置 LINE 作為 OIDC Provider）
    // 如果失敗，使用備選方案
    let authError = null
    try {
      // 注意：這需要在 Supabase Dashboard 中配置 LINE 作為自訂 OIDC Provider
      // 如果沒有配置，這會失敗，然後使用備選方案
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'line' as never, // LINE 可能不是原生支援的 provider
        token: tokenData.id_token,
        nonce: savedNonce,
      })
      authError = error
    } catch (e) {
      authError = e
    }

    // 4. 備選方案：使用 Admin API 建立/登入用戶
    if (authError) {
      console.log('signInWithIdToken failed, using admin API fallback')

      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )

      // 檢查用戶是否存在
      const { data: existingUsers } = await adminClient.auth.admin.listUsers()
      const lineEmail = `line_${profile.userId}@line.tellcraft.app`
      const existingUser = existingUsers?.users?.find(
        (u) => u.email === lineEmail || u.user_metadata?.line_id === profile.userId
      )

      let userId: string

      if (existingUser) {
        // 用戶存在，更新資料
        userId = existingUser.id
        await adminClient.auth.admin.updateUserById(userId, {
          user_metadata: {
            line_id: profile.userId,
            name: profile.displayName,
            avatar_url: profile.pictureUrl,
            provider: 'line',
          },
        })
      } else {
        // 建立新用戶
        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
          email: lineEmail,
          email_confirm: true,
          user_metadata: {
            line_id: profile.userId,
            name: profile.displayName,
            avatar_url: profile.pictureUrl,
            provider: 'line',
          },
        })

        if (createError || !newUser.user) {
          console.error('Failed to create user:', createError)
          return NextResponse.redirect(`${appUrl}/auth/login?error=user_creation_failed`)
        }

        userId = newUser.user.id
      }

      // 為用戶生成 magic link 並自動登入
      // 使用 signInWithOtp 生成一次性登入連結
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: lineEmail,
        options: {
          shouldCreateUser: false,
        },
      })

      if (otpError) {
        // 如果 OTP 也失敗，嘗試使用自訂 session
        console.log('OTP failed, attempting direct session creation')

        // 直接建立 session（需要 service role）
        // 注意：這是較不安全的做法，僅作為最後手段
        // 建議在 Supabase Dashboard 配置 LINE 作為 OIDC Provider

        // 重導向到首頁，並顯示需要再次登入的提示
        // 在生產環境中，應該正確配置 LINE OIDC
        return NextResponse.redirect(
          `${appUrl}/auth/login?message=line_account_created&email=${encodeURIComponent(lineEmail)}`
        )
      }

      // 重導向到魔法連結確認頁
      return NextResponse.redirect(
        `${appUrl}/auth/login?message=check_email&email=${encodeURIComponent(lineEmail)}`
      )
    }

    // signInWithIdToken 成功
    return NextResponse.redirect(`${appUrl}/`)
  } catch (error) {
    console.error('LINE callback error:', error)
    return NextResponse.redirect(`${appUrl}/auth/login?error=callback_failed`)
  }
}
