# [PUT] /games:secret
# Summary: 玩家設定秘密
Feature: 玩家設定秘密

  Background:
    Given (No Actor) 玩家加入遊戲, call table:
      | >alicePlayerId | gameId | playerName |
      | <playerId      | G100   | Alice      |
    And (No Actor) 玩家加入遊戲, call table:
      | >bobPlayerId | gameId | playerName |
      | <playerId    | G100   | Bob        |

  #------------------------------------------------------------
  Rule: 前置 - 玩家必須已加入此場遊戲
  #------------------------------------------------------------

    Example: 玩家加入遊戲後成功設定秘密
      When (No Actor) 玩家設定秘密, call table:
        | gameId | playerRole | secret |
        | G100   | P1         | 1234   |
      Then 玩家設定秘密(200)回應, with table:
        | gameId | yourSecret | yourOpponentSecret |
        | G100   | 1234       | NOT_READY          |

    Example: 玩家未加入遊戲時無法設定秘密
      When (No Actor) 玩家設定秘密, call table:
        | gameId | playerRole | secret |
        | G999   | P1         | 1234   |
      Then 操作失敗

  #------------------------------------------------------------
  Rule: 前置 - 遊戲必須尚未進入猜測階段
  #------------------------------------------------------------

    Example: 玩家在設定秘密階段設定秘密
      When (No Actor) 玩家設定秘密, call table:
        | gameId | playerRole | secret |
        | G100   | P1         | 5678   |
      Then 玩家設定秘密(200)回應, with table:
        | gameId | yourSecret | yourOpponentSecret |
        | G100   | 5678       | NOT_READY          |

    Example: 玩家在猜測階段無法設定秘密
      Given (No Actor) 玩家設定秘密, call table:
        | gameId | playerRole | secret |
        | G100   | P1         | 1234   |
      And (No Actor) 玩家設定秘密, call table:
        | gameId | playerRole | secret |
        | G100   | P2         | 5678   |
      When (No Actor) 玩家設定秘密, call table:
        | gameId | playerRole | secret |
        | G100   | P1         | 9876   |
      Then 操作失敗

  #------------------------------------------------------------
  Rule: 前置 - 玩家設定答案的順序為 P1 先設定，然後是 P2
  #------------------------------------------------------------

    Example: P1 成功首先設定秘密
      When (No Actor) 玩家設定秘密, call table:
        | gameId | playerRole | secret |
        | G100   | P1         | 2468   |
      Then 玩家設定秘密(200)回應, with table:
        | gameId | yourSecret | yourOpponentSecret |
        | G100   | 2468       | NOT_READY          |

    Example: P2 在 P1 之後成功設定秘密
      Given (No Actor) 玩家設定秘密, call table:
        | gameId | playerRole | secret |
        | G100   | P1         | 1357   |
      When (No Actor) 玩家設定秘密, call table:
        | gameId | playerRole | secret |
        | G100   | P2         | 2468   |
      Then 玩家設定秘密(200)回應, with table:
        | gameId | yourSecret | yourOpponentSecret |
        | G100   | 2468       | READY              |

    Example: P2 無法在 P1 之前設定秘密
      When (No Actor) 玩家設定秘密, call table:
        | gameId | playerRole | secret |
        | G100   | P2         | 3691   |
      Then 操作失敗

  #------------------------------------------------------------
  Rule: 後置 - 此玩家的答案會被首次設定
  #------------------------------------------------------------

    Example: 玩家秘密首次設定成功保存
      When (No Actor) 玩家設定秘密, call table:
        | gameId | playerRole | secret |
        | G100   | P1         | 4825   |
      Then 玩家設定秘密(200)回應, with table:
        | gameId | yourSecret | yourOpponentSecret |
        | G100   | 4825       | NOT_READY          |

  #------------------------------------------------------------
  Rule: 後置 - 當兩位玩家都設定好答案後，遊戲進入猜題階段
  #------------------------------------------------------------

    Example: 當兩位玩家都設定好秘密後遊戲進入猜測階段
      Given (No Actor) 玩家設定秘密, call table:
        | gameId | playerRole | secret |
        | G100   | P1         | 7531   |
      When (No Actor) 玩家設定秘密, call table:
        | gameId | playerRole | secret |
        | G100   | P2         | 8642   |
      Then 玩家設定秘密(200)回應, with table:
        | gameId | yourSecret | yourOpponentSecret |
        | G100   | 8642       | READY              |