---
title: pa
description: ...
pubDate: 2024-9-17
series: pa
---
# background

website--[Introduction · GitBook (nju-projectn.github.io)](https://nju-projectn.github.io/ics-pa-gitbook/ics2019/)

# pa1

## 表达式求值

[表达式求值 · GitBook (nju-projectn.github.io)](https://nju-projectn.github.io/ics-pa-gitbook/ics2019/1.5.html)

这里要求我们实现表达式求值，但是使用的方式是利用编译原理中的知识完成。

### 正则表达式

首先我们要实现利用正则表达式来对我们的字符串进行解析

```c
enum {
  TK_NOTYPE = 256,
  TK_EQ,
  TK_NOTEQ,
  TK_DECIMAL,
  TK_AND,
  TK_OR,
  TK_LESSEQ,
  TK_GREATEREQ,
  TK_LESS,
  TK_GREATER,
  TK_HEXADECIMAL,
  TK_REG,
  TK_DEREFERENCE,
  TK_POSNUM,
  TK_NEGNUM
};

static struct rule {
  char *regex;
  int token_type;
} rules[] = {
    {" +", TK_NOTYPE},  // spaces
    {"==", TK_EQ},      // equal
    {"!=", TK_NOTEQ},   // not equal
    {"\\+", '+'},       // plus
    {"\\-", '-'},       //
    {"\\*", '*'},       //
    {"/", '/'},         //
    {"\\(", '('},       //
    {"\\)", ')'},       //
    {"&&", TK_AND},
    {"\\|\\|", TK_OR},
    {"<=", TK_LESSEQ},
    {">=", TK_GREATEREQ},
    {"<", TK_LESS},
    {">", TK_GREATER},
    {"0[xX][0-9a-fA-F]+", TK_HEXADECIMAL},
    {"[0-9]+", TK_DECIMAL},  //
    {"\\$0|pc|ra|[sgt]p|t[0-6]|a[0-7]|s([0-9]|1[0-1])", TK_REG},
};

```

这里我的代码支持基本的四则运算，逻辑运算，支持十进制整数和十六进制整数和寄存器。

### 框架代码

#### make_token

框架代码在调用expr实现计算首先调用make_token来生成tokens。这里如果匹配到整数或寄存器时，除了要保存token还要讲原有的字符串拷贝进tokens数组中，这样才可以完成后续的parse操作。

```c
static bool make_token(char *e) {
  while (e[position] != '\0') {
        switch (rules[i].token_type) {
            case TK_NOTYPE:
              break;
            case TK_DECIMAL:
            case TK_HEXADECIMAL:
            case TK_REG:
              tokens[nr_token].type = rules[i].token_type;
              strncpy(tokens[nr_token].str, substr_start, substr_len);
              tokens[nr_token].str[substr_len] = '\0';
              nr_token++;
              break;
            default:
              tokens[nr_token].type = rules[i].token_type;
              nr_token++;
        }

        break;
      }
    }

}
```

**这里有个小细节就是在匹配正则表达式时，我们要优先进行十六进制的匹配，然后再进行十进制的匹配，否则就会出现将0匹配成十进制而其余部分无法匹配的情况。**

#### eval

最重要的就是eval的实现。流程如下。

```
eval(p, q) {
  if (p > q) {
    /* Bad expression */
  }
  else if (p == q) {
    /* Single token.
     * For now this token should be a number.
     * Return the value of the number.
     */
  }
  else if (check_parentheses(p, q) == true) {
    /* The expression is surrounded by a matched pair of parentheses.
     * If that is the case, just throw away the parentheses.
     */
    return eval(p + 1, q - 1);
  }
  else {
    /* We should do more things here. */
  }
}
```

#### check_parentheses

check_parentheses的作用是检查子式的括号是否匹配，这里我将子式分为了三种情况
1. (expr)   此情况是可以正常计算的。只需要计算eval(p+1, q-1)即可。
2. bad expr 这种情况无需继续计算，返回错误即可。
3. expr 这种情况是我们想要看见的局势，对其进行计算即可。

#### findMainOp

在得到一个单独的表达式时，要对其进行计算我们要先找到他的"主运算符"。

 我们就可以总结出如何在一个token表达式中寻找主运算符了:
- 非运算符的token不是主运算符.
- 出现在一对括号中的token不是主运算符. 注意到这里不会出现有括号包围整个表达式的情况, 因为这种情况已经在`check_parentheses()`相应的`if`块中被处理了.
- 主运算符的优先级在表达式中是最低的. 这是因为主运算符是最后一步才进行的运算符.
- 当有多个运算符的优先级都是最低时, 根据结合性, 最后被结合的运算符才是主运算符. 一个例子是`1 + 2 + 3`, 它的主运算符应该是右边的`+`.

要找出主运算符, 只需要将token表达式全部扫描一遍, 就可以按照上述方法唯一确定主运算符.

#### parse

在得到单个表达式后，我们要对其进行运算，如果是十进制或十六进制，利用`strtol`即可完成。如果是寄存器类型，我们要通过调用` isa_reg_str2val`函数实现对cpu的访问。

```c

int parse(Token tk) {
  char *ptr;
  switch (tk.type) {
    case TK_DECIMAL:      return strtol(tk.str, &ptr, 10);
    case TK_HEXADECIMAL:  return strtol(tk.str, &ptr, 16);
    case TK_REG: {
      bool success;
      int ans = isa_reg_str2val(tk.str, &success);
      if (success) {  return ans;
      } else {
        Log("reg visit fail\n");
        return 0;
      }
    }
    default: {
      Log("cannot parse number\n");
      assert(0);
    }
  }
    return 0;
}

```


### 单目运算符

我这里单目运算符只支持正负，不支持取反或逻辑非。~~下次一定~~

检测是否单目运算符只需根据该运算符前后的是否数字即可进行简单的判断。

```c

uint32_t expr(char *e, bool *success) {
	/* 指针类型*/
  for (int i = 0; i < nr_token; i++) {
    if (i == 0 ||
            (tokens[i - 1].type != TK_REG && tokens[i - 1].type != TK_DECIMAL &&
             tokens[i - 1].type != TK_HEXADECIMAL &&
             tokens[i - 1].type != ')' && tokens[i - 1].type != TK_POSNUM &&
             tokens[i - 1].type != TK_NEGNUM))
      if (tokens[i].type == '*') tokens[i].type = TK_DEREFERENCE;
  }

  /* NEG OR POS NUMBER TYPE */
  for (int i = 0; i < nr_token; i++) {
    if (i == 0 ||
            (tokens[i - 1].type != TK_REG && tokens[i - 1].type != TK_DECIMAL &&
             tokens[i - 1].type != TK_HEXADECIMAL &&
             tokens[i - 1].type != ')' &&
             tokens[i - 1].type != TK_DEREFERENCE &&
             tokens[i - 1].type != TK_POSNUM &&
             tokens[i - 1].type != TK_NEGNUM)) {
      switch (tokens[i].type) {
        case '+':
          tokens[i].type = TK_POSNUM;
          break;
        case '-':
          tokens[i].type = TK_NEGNUM;
          break;
      }
    }
  }

  *success = true;

  return eval(0, nr_token - 1, success);
}
```

至此就大概完成了表达式计算的全部要求。




