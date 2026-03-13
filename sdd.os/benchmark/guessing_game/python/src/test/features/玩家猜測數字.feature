# [POST] /games:guess
# Summary: 玩家猜測數字
Feature: 玩家猜測數字

  Background:
    Given (No Actor) 玩家加入遊戲, call table:
      | gameId | playerName |
      | G301   | Alice      |
    And (No Actor) 玩家加入遊戲, call table:
      | gameId | playerName |
      | G301   | Bob        |
    And (No Actor) 玩家設定秘密, call table:
      | gameId | playerRole | secret |
      | G301   | P1         |   1234 |
    And (No Actor) 玩家設定秘密, call table:
      | gameId | playerRole | secret |
      | G301   | P2         |   5678 |
  #------------------------------------------------------------

  Rule: 前置 - 玩家必須已加入此場遊戲
  #------------------------------------------------------------

    Example: 玩家加入遊戲後成功進行猜測
      When (No Actor) 玩家猜測數字, call table:
        | gameId | playerRole | guess |
        | G301   | P1         |  5679 |
      Then 玩家猜測數字(200)回應, with table:
        | result.a | result.b | gameStatus |
        |        3 |        0 | Guessing   |

    Example: 玩家未加入遊戲時無法進行猜測
      When (No Actor) 玩家猜測數字, call table:
        | gameId | playerRole | guess |
        | G301   | P3         |  1234 |
      Then 操作失敗
  #------------------------------------------------------------
  Rule: 前置 - 遊戲必須已進入猜測階段
  #------------------------------------------------------------

    Example: 玩家在猜測階段進行猜測
      When (No Actor) 玩家猜測數字, call table:
        | gameId | playerRole | guess |
        | G301   | P1         |  5679 |
      Then 玩家猜測數字(200)回應, with table:
        | result.a | result.b | gameStatus |
        |        3 |        0 | Guessing   |

    Example: 玩家在設定秘密階段無法進行猜測
      Given (No Actor) 玩家加入遊戲, call table:
        | gameId | playerName |
        | G302   | Charlie    |
      And (No Actor) 玩家加入遊戲, call table:
        | gameId | playerName |
        | G302   | Diana      |
      When (No Actor) 玩家猜測數字, call table:
        | gameId | playerRole | guess |
        | G302   | P1         |  9876 |
      Then 操作失敗
  #------------------------------------------------------------
  Rule: 前置 - 每回合每名玩家只能猜測一次
  #------------------------------------------------------------

    Example: 玩家成功在回合中進行第一次猜測
      When (No Actor) 玩家猜測數字, call table:
        | gameId | playerRole | guess |
        | G301   | P1         |  5679 |
      Then 玩家猜測數字(200)回應, with table:
        | result.a | result.b | gameStatus |
        |        3 |        0 | Guessing   |

    Example: 玩家無法在同一回合中進行第二次猜測
      When (No Actor) 玩家猜測數字, call table:
        | gameId | playerRole | guess |
        | G301   | P1         |  5679 |
      And (No Actor) 玩家猜測數字, call table:
        | gameId | playerRole | guess |
        | G301   | P1         |  5670 |
      Then 操作失敗
  #------------------------------------------------------------

  Rule: 後置 - 雙方玩家猜測完後進入下一個回合
  #------------------------------------------------------------

    Example: 雙方玩家猜測完後遊戲進入下一個回合
      When (No Actor) 玩家猜測數字, call table:
        | gameId | playerRole | guess |
        | G301   | P1         |  5679 |
      And (No Actor) 玩家猜測數字, call table:
        | gameId | playerRole | guess |
        | G301   | P2         |  1235 |
      Then 玩家猜測數字(200)回應, with table:
        | result.a | result.b | gameStatus |
        |        3 |        0 | Guessing   |
  #------------------------------------------------------------

  Rule: 後置 - 每次猜測會回傳「幾A幾B」的結果
    # * A 表示數字正確且位置也正確的個數
    # * B 表示數字正確但位置不正確的個數
    # * 系統將玩家猜的 4 位數與對手的秘密答案逐位比對
    # * 若某個數字在相同位置上與對手的數字相同，則累計 1A
    # * 若某個數字存在於對手的答案中但位置不同，則累計 1B
    # * 同一個數字可以多次被計算為 1B，好比說對手的答案為 1234，而你的猜測為 1111，則會是 1A3B，因為從第二個 1 到第四個 1 都是「數字存在但位置不同」。
  #------------------------------------------------------------

    Scenario Outline: 玩家猜測後獲得不同的 A 和 B 計數結果
      When (No Actor) 玩家猜測數字, call table:
        | gameId | playerRole | guess   |
        | G301   | P1         | <guess> |
      Then 玩家猜測數字(200)回應, with table:
        | result.a | result.b | gameStatus   |
        | <a>      | <b>      | <gameStatus> |

      Examples:
        | guess | a | b | gameStatus |
        | 5678  | 4 | 0 | Ended      |
        | 8765  | 0 | 4 | Guessing   |
        | 5555  | 1 | 3 | Guessing   |
        | 6666  | 1 | 3 | Guessing   |
        | 7777  | 1 | 3 | Guessing   |
        | 8888  | 1 | 3 | Guessing   |
        | 1234  | 0 | 0 | Guessing   |
        | 5687  | 2 | 2 | Guessing   |
        | 5768  | 2 | 2 | Guessing   |
        | 6578  | 2 | 2 | Guessing   |
        | 6785  | 0 | 4 | Guessing   |
        | 7856  | 0 | 4 | Guessing   |
        | 5566  | 1 | 3 | Guessing   |
        | 7788  | 1 | 3 | Guessing   |
        | 5656  | 2 | 2 | Guessing   |
        | 9012  | 0 | 0 | Guessing   |
        | 5123  | 1 | 0 | Guessing   |
        | 6758  | 1 | 3 | Guessing   |
        | 5679  | 3 | 0 | Guessing   |
        | 8675  | 2 | 2 | Guessing   |
        
  #------------------------------------------------------------

  Rule: 後置 - 若玩家猜出的結果為「4A」，即代表猜中對手的秘密數字，該玩家立即獲勝
  #------------------------------------------------------------

    Example: 玩家以 4A0B 結果立即獲勝
      When (No Actor) 玩家猜測數字, call table:
        | gameId | playerRole | guess |
        | G301   | P1         |  5678 |
      Then 玩家猜測數字(200)回應, with table:
        | result.a | result.b | gameStatus |
        |        4 |        0 | Ended      |
      And 應該存在一個遊戲, with table:
        | id | status | winnerId |
        | G301   | Ended  | P1       |