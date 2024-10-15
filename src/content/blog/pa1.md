---
title: pa1
description: ...
pubDate: 2024-9-17
series: pa
---
# ICS2019

## background

website--[Introduction · GitBook (nju-projectn.github.io)](https://nju-projectn.github.io/ics-pa-gitbook/ics2019/)

## pa1

### 表达式求值

[表达式求值 · GitBook (nju-projectn.github.io)](https://nju-projectn.github.io/ics-pa-gitbook/ics2019/1.5.html)

这里要求我们实现表达式求值，但是使用的方式是利用编译原理中的知识完成。

#### 正则表达式

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

#### 框架代码

##### make_token

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

##### eval

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

##### check_parentheses

check_parentheses的作用是检查子式的括号是否匹配，这里我将子式分为了三种情况
1. (expr)   此情况是可以正常计算的。只需要计算eval(p+1, q-1)即可。
2. bad expr 这种情况无需继续计算，返回错误即可。
3. expr 这种情况是我们想要看见的局势，对其进行计算即可。

##### findMainOp

在得到一个单独的表达式时，要对其进行计算我们要先找到他的"主运算符"。

 我们就可以总结出如何在一个token表达式中寻找主运算符了:
- 非运算符的token不是主运算符.
- 出现在一对括号中的token不是主运算符. 注意到这里不会出现有括号包围整个表达式的情况, 因为这种情况已经在`check_parentheses()`相应的`if`块中被处理了.
- 主运算符的优先级在表达式中是最低的. 这是因为主运算符是最后一步才进行的运算符.
- 当有多个运算符的优先级都是最低时, 根据结合性, 最后被结合的运算符才是主运算符. 一个例子是`1 + 2 + 3`, 它的主运算符应该是右边的`+`.

要找出主运算符, 只需要将token表达式全部扫描一遍, 就可以按照上述方法唯一确定主运算符.

##### parse

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


#### 单目运算符

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

### watchpoint

检查点的关键是完成存储WP的链表。每个节点要保存
* 表达式，用于计算
* enable 表示是否可用
* 值 为了值是否发生变化，因此需要存储新旧两个值
* next

同时完成新建，删除，free，打印，计算检查点的功能。

```c

typedef struct watchpoint {
  int NO;
  struct watchpoint *next;
  char* expression;
  uint32_t value;
  uint32_t old_value;
  bool enable;

} WP;

WP* new_wp();
void free_wp(WP*);
bool delete_wp(int);
bool change_wp();
void print_wp();

```

在初始化时，初始化32个watchpoint。保存在空闲链表free_中。每次申请一个，就将其使用头插法从free_中取下，插入head中。free时同理，从head中取下，头插法插入free_中。

根据提示，在每执行完一步运算后，要检查检查点的值是否发生变化，如果发生变化，就将cpu的状态设置为`NEMU_STOP`，在cpu_exec()中完成检查。

```c

/* Simulate how the CPU works. */
void cpu_exec(uint64_t n) {
  log_clearbuf();

    /* TODO: check watchpoints here. */
    if(change_wp()){
      nemu_state.state = NEMU_STOP;
      print_wp();
    }
}
```

这样就完成了检查点的功能。


## 附

### expr.c
```c
#include "nemu.h"

/* We use the POSIX regex functions to process regular expressions.
 * Type 'man regex' for more information about POSIX regex functions.
 */
#include <sys/types.h>
#include <regex.h>
#include <stdlib.h>

uint32_t isa_reg_str2val(const char *s, bool *success);

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
  /* TODO: Add more token types */

};

static struct rule {
  char *regex;
  int token_type;
} rules[] = {

    /* TODO: Add more rules.
     * Pay attention to the precedence level of different rules.
     */

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

#define NR_REGEX (sizeof(rules) / sizeof(rules[0]) )

static regex_t re[NR_REGEX] = {};

/* Rules are used for many times.
 * Therefore we compile them only once before any usage.
 */
void init_regex() {
  int i;
  char error_msg[128];
  int ret;

  for (i = 0; i < NR_REGEX; i ++) {
    ret = regcomp(&re[i], rules[i].regex, REG_EXTENDED);
    if (ret != 0) {
      regerror(ret, &re[i], error_msg, 128);
      panic("regex compilation failed: %s\n%s", error_msg, rules[i].regex);
    }
  }
}

typedef struct token {
  int type;
  char str[32];
} Token;

static Token tokens[32] __attribute__((used)) = {};
static int nr_token __attribute__((used))  = 0;

static bool make_token(char *e) {
  int position = 0;
  int i;
  regmatch_t pmatch;

  nr_token = 0;

  while (e[position] != '\0') {
    /* Try all rules one by one. */
    for (i = 0; i < NR_REGEX; i ++) {
      if (regexec(&re[i], e + position, 1, &pmatch, 0) == 0 && pmatch.rm_so == 0) {
        char *substr_start = e + position;
        int substr_len = pmatch.rm_eo;

        Log("match rules[%d] = \"%s\" at position %d with len %d: %.*s",
            i, rules[i].regex, position, substr_len, substr_len, substr_start);
        position += substr_len;

        /* TODO: Now a new token is recognized with rules[i]. Add codes
         * to record the token in the array `tokens'. For certain types
         * of tokens, some extra actions should be performed.
         */

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

    if (i == NR_REGEX) {
      printf("no match at position %d\n%s\n%*.s^\n", position, e, position, "");
      return false;
    }
  }

  return true;
}

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


// result case: 1-> (exp), 0 -> wrong exp, -1 -> exp
int check_parentheses(int p, int q) {
  int result = -1;
  int layer = 0;
  if (tokens[p].type == '(' && tokens[q].type == ')') {
    result = 1;
    for (int i = p + 1; i <= q - 1; i++) {
      if(layer < 0){
        // Log("bad exp");
        return 0;
        // result = 0;  // 0 or -1
        // break;
      }
      if (tokens[i].type == '(') layer++;
      if (tokens[i].type == ')') layer--;
    }
  }

  layer = 0;
  for (int i = p; i <= q; i++) {
    if (layer < 0) {
      // Log("bad exp");
      return 0;
      // result = 0;
      // break;
    }
    if (tokens[i].type == '(') layer++;
    if (tokens[i].type == ')') layer--;
  }

  if (layer != 0) return 0;

  return result;
}


int op_precedence(int type) {
  switch (type) {
    case TK_NEGNUM:
    case TK_POSNUM:      return 1;
    case TK_DEREFERENCE: return 2;
    case '*':
    case '/':            return 3;
    case '+':
    case '-':            return 4;
    case TK_LESS:
    case TK_GREATER:
    case TK_LESSEQ:
    case TK_GREATEREQ:   return 5;
    case TK_EQ:
    case TK_NOTEQ:       return 6;
    case TK_AND:         return 7;
    case TK_OR:          return 8;
  }
  return 0;
}

uint32_t findMainOp(int p, int q) {
  uint32_t res = p;
  int layer = 0;
  int precedence = 0;
  for (int i = p; i <= q; i++) {
    if (layer == 0) {
      int type = tokens[i].type;
      if (type == '(') {  layer++;  continue; }
      if (type == ')') {
        Log("Bad expression at [%d %d]\n", p, q);
        return 0;
      }
      int tmp = op_precedence(type);
      if (tmp >= precedence) {
        res = i;
        precedence = tmp;
      }
    } else {
      if (tokens[i].type == ')') layer--;
      else if (tokens[i].type == '(') layer++;
    }
  }

  if (layer != 0 || precedence == 0) Log("Bad expression at [%d %d]\n", p, q);

  return res;
}

uint32_t eval(int p, int q, bool* success){
  if (p > q) {
    Log("Bad expression. p>q \n");
    *success = false;
    return 0;
  } else if (p == q) {
     if (tokens[p].type!=TK_DECIMAL && tokens[p].type!=TK_HEXADECIMAL && tokens[p].type!=TK_REG){
      Log("Bad expression. Single token is wrong. \n");
      *success = false;
      return 0;
    }
    return parse(tokens[p]);
  }

  int check = check_parentheses(p, q);
  uint32_t op = findMainOp(p, q);
  Log("min op = %d", op);


  if (check == 0 && op==0) {
    Log("Bad expression, [%d, %d]\n", p, q);
    *success = false;
    return 0;
  } else if (check == 1) {
    return eval(p + 1, q - 1, success);
  } else {
   
    uint32_t val1 = 0;

    if(tokens[op].type != TK_DEREFERENCE && tokens[op].type != TK_NEGNUM && tokens[op].type != TK_POSNUM){
      val1 = eval(p, op - 1, success);
    }

    if (*success == false) {
      Log("calculate false  p = %d q = %d vla1 = %d", p, q, val1);
      return 0;
    }


    uint32_t val2 = eval(op + 1, q, success);
    if (*success == false) {
      Log("calculate false  p = %d q = %d vla2 = %d", p, q, val2);
    	return 0;
    }
    switch (tokens[op].type){
	    case TK_DEREFERENCE: return vaddr_read(val2,4);
			case TK_NEGNUM: return -eval(op+1, q, success);
			case TK_POSNUM: return eval(op+1, q, success);
      case '+':  return val1+val2;
      case '-':  return val1-val2;
      case '*':  return val1*val2;
      case '/': if(val2==0){  Log("Divide by 0 !\n");  *success=false; return 0;  }
        // printf("val1:%u / val2:%u\n", val1, val2);
                   return val1 / val2;
      case TK_EQ:  return val1 == val2;
      case TK_NOTEQ:  return val1!=val2;
      case TK_AND:  return val1&&val2;
      case TK_OR: return val1 || val2;
      case TK_LESS: return val1<val2;
      case TK_GREATER:  return val1 > val2;
      case TK_LESSEQ: return val1 <= val2;
      case TK_GREATEREQ:  return val1>=val2;
      default: {  Log("Bad expression !\n"); *success = false; return 0; }
    }
  }
}



uint32_t expr(char *e, bool *success) {
  if (!make_token(e)) {
    *success = false;
    return 0;
  }

  /* TODO: Insert codes to evaluate the expression. */
  // TODO();

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

### watchpoint.c

```c
typedef struct watchpoint {
  int NO;
  struct watchpoint *next;

  /* TODO: Add more members if necessary */
  char* expression;
  uint32_t value;
  uint32_t old_value;
  bool enable;

} WP;

WP* new_wp();
void free_wp(WP*);
bool delete_wp(int);
bool change_wp();
void print_wp();



#include <stdlib.h>
#include <string.h>

#include "monitor/watchpoint.h"
#include "monitor/expr.h"

#define NR_WP 32

static WP wp_pool[NR_WP] = {};
static WP *head = NULL, *free_ = NULL;

void init_wp_pool() {
  int i;
  for (i = 0; i < NR_WP; i ++) {
    wp_pool[i].NO = i;
    wp_pool[i].next = &wp_pool[i + 1];
  }
  wp_pool[NR_WP - 1].next = NULL;

  head = NULL;
  free_ = wp_pool;
}

/* TODO: Implement the functionality of watchpoint */



WP *new_wp(char* expression) {
  WP *res = free_;
  if (res == NULL) assert(0);

  free_ = free_->next;

  res->next = head;
  head = res;

  res->expression = (char *)malloc(strlen(expression) * sizeof(char));
  strcpy(res->expression, expression);
  bool success;
  res->value = expr(res->expression, &success);
  res->old_value = res->value;
  res->enable = true;

  return res;
}

void free_wp(WP *wp) {
  WP* ptr;

  if(head == wp){
    ptr = head;
    head = head->next;
    ptr->next = free_;
    free_ = ptr;
    wp->enable = false;
  } else {
    for (ptr = head; ptr != NULL && ptr->next != wp; ptr = ptr->next) {}

    if (ptr == NULL) {
      Log("not find such watchpoint\n");
    } else {
      ptr->next = wp->next;
      wp->next = free_;
      free_ = wp;
      wp->enable = false;
    }
  }
}

bool delete_wp(int no){
  WP *ptr;
  bool found = false;
  // printf("no%d\n", no);
  for (ptr = head; ptr != NULL; ptr = ptr->next) {
    if (ptr->NO == no) {
      free_wp(ptr);
      found = true;
      break;
    }
  }
  if(!found){
    Log("No such an activatd watchpoint\n");
  }
  return found;
}



bool change_wp() {
  bool has_changed = false;
  WP *ptr;
  for (ptr = head; ptr != NULL; ptr = ptr->next) {
    bool success;
    int val = expr(ptr->expression, &success);
    ptr->old_value = ptr->value;
    ptr->value = val;
    if(ptr->value != ptr->old_value){
      has_changed = true;
    }
  }
  return has_changed;
}


void print_wp(){
  WP* ptr;
  printf("%-10s%-32s%-16s%-16s%-8s%-8s\n", "NO", "expression", "old_value",
         "value", "change", "enable");
  for (ptr = head; ptr != NULL; ptr = ptr->next)  {
    char changed = (ptr->old_value == ptr->value) ? 'N' : 'Y';
    char enabled = (ptr->enable) ? 'Y' : 'N';
    printf("%-10d%-32s%-16d%-16d%-8c%-8c\n", ptr->NO, ptr->expression,
           ptr->old_value, ptr->value, changed, enabled);
  }
}

```

### ui.c

```c
#include "monitor/monitor.h"
#include "monitor/expr.h"
#include "monitor/watchpoint.h"
#include "nemu.h"

#include <stdlib.h>
#include <readline/readline.h>
#include <readline/history.h>

void cpu_exec(uint64_t);
void isa_reg_display();
/* We use the `readline' library to provide more flexibility to read from stdin.
 */
static char* rl_gets() {
  static char *line_read = NULL;

  if (line_read) {
    free(line_read);
    line_read = NULL;
  }

  line_read = readline("(nemu) ");

  if (line_read && *line_read) {
    add_history(line_read);
  }

  return line_read;
}

static int cmd_c(char *args) {
  cpu_exec(-1);
  return 0;
}

static int cmd_q(char *args) {
  return -1;
}

static int cmd_si(char *args) {
 
  if (args == NULL) {
    cpu_exec(1);
  } else {
    int n;
    sscanf(args, "%d", &n);
    cpu_exec(n);
  }
  return 0;
}

static int cmd_info(char *args){
  char op;
  sscanf(args, "%c", &op);
  if(op=='r'){
    isa_reg_display();
  } else if (op == 'w') {
    print_wp();
  }
  return 0;
}

static int cmd_x(char *args) { 
  if (args == NULL){
    return 0;
  }
  char *arg = strtok(args, " ");
  int n = atoi(arg);
  arg = strtok(NULL, " ");
  if (arg == NULL) return 0;

  bool success = true;

  vaddr_t addr = expr(arg, &success);

  if(success == false ){
    printf("bad expression %s \n", arg);
    return 0;
  }
  for (int i = 0; i < n; i++) {
    printf("0x%08x: ", addr);
    for (int j = 0; j < 4; j++) {
      printf("%02x ", vaddr_read(addr, 1));
      addr++;
    }
    printf("\n");
  }
  return 0;

}

static int cmd_p(char *args) {
  if (args == NULL) return 0;
  bool success = true;
  uint32_t res = expr(args, &success);
  if(success){
    printf("%s  =  %d\n", args, res);
  }
  return 0;
}

static int cmd_w(char *args) {
  if (args == NULL) return 0;

  new_wp(args);
  return 0;
}

static int cmd_d(char *args){
  if (args == NULL) return 0;
  delete_wp(atoi(args));
  return 0;
}


static int cmd_help(char *args);

static struct {
  char *name;
  char *description;
  int (*handler) (char *);
} cmd_table [] = {
  { "help", "Display informations about all supported commands", cmd_help },
  { "c", "Continue the execution of the program", cmd_c },
  { "q", "Exit NEMU", cmd_q },

  /* TODO: Add more commands */
  { "si", "si [N] exec n steps",cmd_si},
  { "info", "info r/w print regs or memory",cmd_info},
  { "x", " x N EXPR", cmd_x }, 
  { "p", "p expr ", cmd_p },
  { "w", "w expr ", cmd_w },
  { "d", "d N", cmd_d },
};

#define NR_CMD (sizeof(cmd_table) / sizeof(cmd_table[0]))

static int cmd_help(char *args) {
  /* extract the first argument */
  char *arg = strtok(NULL, " ");
  int i;

  if (arg == NULL) {
    /* no argument given */
    for (i = 0; i < NR_CMD; i ++) {
      printf("%s - %s\n", cmd_table[i].name, cmd_table[i].description);
    }
  }
  else {
    for (i = 0; i < NR_CMD; i ++) {
      if (strcmp(arg, cmd_table[i].name) == 0) {
        printf("%s - %s\n", cmd_table[i].name, cmd_table[i].description);
        return 0;
      }
    }
    printf("Unknown command '%s'\n", arg);
  }
  return 0;
}

void ui_mainloop(int is_batch_mode) {
  if (is_batch_mode) {
    cmd_c(NULL);
    return;
  }

  for (char *str; (str = rl_gets()) != NULL; ) {
    char *str_end = str + strlen(str);

    /* extract the first token as the command */
    char *cmd = strtok(str, " ");
    if (cmd == NULL) { continue; }

    /* treat the remaining string as the arguments,
     * which may need further parsing
     */
    char *args = cmd + strlen(cmd) + 1;
    if (args >= str_end) {
      args = NULL;
    }

#ifdef HAS_IOE
    extern void sdl_clear_event_queue(void);
    sdl_clear_event_queue();
#endif

    int i;
    for (i = 0; i < NR_CMD; i ++) {
      if (strcmp(cmd, cmd_table[i].name) == 0) {
        if (cmd_table[i].handler(args) < 0) { return; }
        break;
      }
    }

    if (i == NR_CMD) { printf("Unknown command '%s'\n", cmd); }
  }
}
```