# [POST] /games
# Summary: 玩家加入遊戲
Feature: 玩家加入遊戲

  #------------------------------------------------------------
  Rule: 後置 - 玩家輸入一組 3~5 位字元組成的「遊戲 ID」進行配對
  #------------------------------------------------------------

    Scenario Outline: 玩家使用有效的遊戲 ID 格式加入
      When (No Actor) 玩家加入遊戲, call table:
        | gameId   | playerName   |
        | <gameId> | <playerName> |
      Then 玩家加入遊戲(200)回應, with table:
        | gameId   | playerRole |
        | <gameId> | P1         |

      Examples:
        | gameId | playerName |
        | ABC    | Alice      |
        | ABCD   | Bob        |
        | ABCDE  | Charlie    |
        | A1B    | Diana      |
        | 12345  | Emma       |

    Scenario Outline: 玩家使用無效的遊戲 ID 格式加入失敗
      When (No Actor) 玩家加入遊戲, call table:
        | gameId   | playerName   |
        | <gameId> | <playerName> |
      Then 操作失敗

      Examples:
        | gameId  | playerName |
        | AB      | Frank      |
        | A       | Grace      |
        | ABCDEF  | Henry      |
        | ABCDEFG | Ivy        |
        | A@B     | Jack       |

  #------------------------------------------------------------
  Rule: 後置 - 若系統中尚無此 ID，則創建新遊戲，該玩家的角色為 P1
  #------------------------------------------------------------

    Example: 第一位玩家創建新遊戲並成為 P1
      When (No Actor) 玩家加入遊戲, call table:
        | gameId | playerName |
        | G001   | Emma       |
      Then 玩家加入遊戲(200)回應, with table:
        | gameId | playerRole |
        | G001   | P1         |

  #------------------------------------------------------------
  Rule: 後置 - 若該 ID 已存在且遊戲尚未進入猜題階段，則玩家加入之角色為 P2
  #------------------------------------------------------------

    Example: 第二位玩家加入現有遊戲並成為 P2
      Given (No Actor) 玩家加入遊戲, call table:
        | gameId | playerName |
        | G002   | Frank      |
      When (No Actor) 玩家加入遊戲, call table:
        | gameId | playerName |
        | G002   | Grace      |
      Then 玩家加入遊戲(200)回應, with table:
        | gameId | playerRole |
        | G002   | P2         |

  #------------------------------------------------------------
  Rule: 後置 - 若該遊戲已有兩位玩家，則拒絕加入並顯示提示訊息
  #------------------------------------------------------------

    Example: 第三位玩家無法加入已有兩位玩家的遊戲
      Given (No Actor) 玩家加入遊戲, call table:
        | gameId | playerName |
        | G004   | Ivy        |
      And (No Actor) 玩家加入遊戲, call table:
        | gameId | playerName |
        | G004   | Jack       |
      When (No Actor) 玩家加入遊戲, call table:
        | gameId | playerName |
        | G004   | Kelly      |
      Then 操作失敗

  #------------------------------------------------------------
  Rule: 後置 - 同一玩家不得重複加入同一場遊戲
  #------------------------------------------------------------

    Example: 玩家無法重複加入同一場遊戲
      Given (No Actor) 玩家加入遊戲, call table:
        | gameId | playerName |
        | G005   | Larry      |
      When (No Actor) 玩家加入遊戲, call table:
        | gameId | playerName |
        | G005   | Larry      |
      Then 操作失敗

  #------------------------------------------------------------
  Rule: 後置 - 當遊戲有兩位玩家時，進入設定秘密數字階段
  #------------------------------------------------------------

    Example: 當兩位玩家加入時遊戲進入設定秘密階段
      Given (No Actor) 玩家加入遊戲, call table:
        | gameId | playerName |
        | G006   | Mike       |
      When (No Actor) 玩家加入遊戲, call table:
        | gameId | playerName |
        | G006   | Nancy      |
      Then 玩家加入遊戲(200)回應, with table:
        | gameId | playerRole |
        | G006   | P2         |