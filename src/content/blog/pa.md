---
title: pa
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

## pa2

### 阅读手册


查看手册，发现RV32I只有6种基本的指令，分别是U型指令，I型指令，J型指令，B型指令，R型指令，S型指令；对应的功能是：
1. U型指令：用于长立即数的U型指令
2. I型指令：用于短立即数和访存load的I型指令
3. J型指令：用于无条件跳转的J型指令
4. B型指令：用于条件跳转的B型指令
5. R型指令：用于寄存器和寄存器之间操作的R类型指令
6. S型指令：用于访存store的S型指令

所有指令的长度是32位长度。指令提供三个寄存器操作数。所有指令编码中，要读写的寄存器标识位置是固定的，在解码指令之前，就可以开始访问寄存器。立即数字段总是符号扩展，符号位总是在指令中的最高位，这意味着可能成为关键路径的立即数符号扩展可以在指令解码之前进行。

指令格式类型，对应的指令编码的位置：
![](./pa-img/riscv32-zl.png)

可以看到，B类型和S类型是一样的，J类型和U类型是一样的，就是对于字段的解释不一样。所以，也可以认为是4种类型。

全0的指令码和全1的指令码都是非法指令，这个可以方便程序员调试。

**RV32I整数指令概述**

算术指令：add, sub

逻辑指令：add, or, xor

移位指令：sll, srl, sra

上述指令还有立即数的版本，立即数总是进行符号扩展.

程序可以根据比较结果生成布尔值。slt和sltu，也有立即数版本，slti, sltiu。（带u后缀的为无符号版本）

加载立即数到高位lui将20位常量加载到寄存器的高20位，接着可以使用标准的立即指令来创建32位常量。

auipc指令将立即数左移12位加到PC上。这样，可以将auipc中的20位立即数与jalr中的12位立即数组合，将执行流程转移到任何32位pc相对地址。而auipc加上普通加载或存储指令中的12位立即数偏移量，可以使得程序访问任何32位PC相对地址的数据。

**RV32I的寄存器**

一共32个寄存器，x0到x31，其中x0总是0。

寄存器有别名，别名可以帮助记忆关于调用惯例方面的规范。

下面是寄存器及其别名的对应关系：
![](./pa-img/regs.png)


还有一个是PC寄存器，该寄存器不属于通用寄存器，指向当前正在执行的指令的内存地址。

这里是别名的分类：zero, ra, sp, gp, tp, t0-t6, s0-s11, fp(s0), a0-a7。这里的别名在考虑到RISC-V上面执行过程调用惯例的时候会有意义，包括如何放置参数，如何放置返回值，哪些是调用者保存的，哪些是被调用者保存的等。对于底层的硬件来说，这些寄存器除了x0之外没有任何区别。


**RV32I的Load和Store**

lw (32bits)
sw
lb (8bits)
lbu
lh (16bits)
lhu

加载和存储支持的唯一的寻址模式是符号扩展12位立即数加上基地址寄存器。RISC-V使用的是小端机结构。

**R32I的条件分支**

beq
bne
bge
bgeu
blt
bltu

由于RISC-V指令长度必须是两个字节的倍数，分支指令的寻址方式是12位的立即数乘以2，符号扩展，然后加到PC上作为分支的跳转地址。

RISCV指令中没有条件码。

**无条件跳转**

jal将下一条指令PC+4的地址保存到目标寄存器中，通常是返回地址寄存器ra。如果使用x0来替换ra，则可以实现无条件跳转，因为x0不能被更改。

jalr可以调用地址是动态计算出来的函数，或者也可以实现调用返回（ra作为源寄存器，x0作为目标寄存器）。

**伪指令：不是真的机器指令，会被汇编器翻译为真实的物理指令。**

例如： ret 被汇编为：jalr x0, x1, 0

下表给出了一系列伪指令及其依赖的真实的处理器物理指令（这些伪指令都依赖于x0寄存器，从中可以看到x0寄存器的作用）。
![](./pa-img/伪指令.png)

下表是另外一些伪指令及其被汇编之后的物理指令：

![](./pa-img/物理指令.png)

下面是汇编器的指示符 assemble directives，可以在汇编语言的源代码中看到，了解这些指示符可以帮助理解汇编语言编写的程序。

.text 进入代码段

.aligh 2 后续代码按照2\^2字节对齐

.global main 声明全局符号main

.section .rodata 进入只读数据段

.balign 4 数据段安装4字节对齐

.string "hello, %s!\n" 创建空字符结尾的字符串

![](./pa-img/指示符.png)


### dummy.c

查看反汇编代码
```
Disassembly of section .text:

80100000 <_start>:
80100000:	00000413          	li	s0,0
80100004:	00009117          	auipc	sp,0x9
80100008:	ffc10113          	addi	sp,sp,-4 # 80109000 <_end>
8010000c:	00c000ef          	jal	ra,80100018 <_trm_init>

Disassembly of section .text.startup:

80100010 <main>:
80100010:	00000513          	li	a0,0
80100014:	00008067          	ret

Disassembly of section .text._trm_init:

80100018 <_trm_init>:
80100018:	80000537          	lui	a0,0x80000
8010001c:	ff010113          	addi	sp,sp,-16
80100020:	00050513          	mv	a0,a0
80100024:	00112623          	sw	ra,12(sp)
80100028:	fe9ff0ef          	jal	ra,80100010 <main>
8010002c:	00050513          	mv	a0,a0
80100030:	0000006b          	0x6b
80100034:	0000006f          	j	80100034 <_trm_init+0x1c>

```

我们需要实现li，auipc，addi，jal，ret，lui，mv，sw，j等指令。

继续查看手册，我们可以发现 li 指令是 lui 和 addi 指令的组合，因此不需 要单独实现；最后的 ret 指令是伪指令，其实需要实现的是 jalr；mv 指令也是伪 指令，会被扩展成 addi rd, rs1, 0，不需要单独实现。那么我们在本部分只需要实 现 li、auipc、addi、jal、jalr 即可。

首先可以实现全部译码的程序

```c
#include "cpu/decode.h"

#include "rtl/rtl.h"

  

// decode operand helper

#define make_DopHelper(name) void concat(decode_op_, name) (Operand *op, uint32_t val, bool load_val)

  

static inline make_DopHelper(i) {
  op->type = OP_TYPE_IMM;
  op->imm = val;
  rtl_li(&op->val, op->imm);
  print_Dop(op->str, OP_STR_SIZE, "%d", op->imm);
}

static inline make_DopHelper(r) {
  op->type = OP_TYPE_REG;
  op->reg = val;
  if (load_val) {
    rtl_lr(&op->val, op->reg, 4);
  }
  print_Dop(op->str, OP_STR_SIZE, "%s", reg_name(op->reg, 4));
}

make_DHelper(U) {
  decode_op_i(id_src, decinfo.isa.instr.imm31_12 << 12, true);
  decode_op_r(id_dest, decinfo.isa.instr.rd, false);
  print_Dop(id_src->str, OP_STR_SIZE, "0x%x", decinfo.isa.instr.imm31_12);
}

make_DHelper(I){
  decode_op_r(id_src, decinfo.isa.instr.rs1, true);
  decode_op_i(id_src2, decinfo.isa.instr.simm11_0, true);
  print_Dop(id_src->str, OP_STR_SIZE, "0x%x", decinfo.isa.instr.rs1);
  print_Dop(id_src2->str, OP_STR_SIZE, "0x%x", decinfo.isa.instr.simm11_0);
  decode_op_r(id_dest, decinfo.isa.instr.rd, false);
}

make_DHelper(J){
  int32_t offset =
      (decinfo.isa.instr.simm20 << 20) | (decinfo.isa.instr.imm19_12 << 12) |
      (decinfo.isa.instr.imm11_ << 11) | (decinfo.isa.instr.imm10_1 << 1);
  decode_op_i(id_src, offset, true);
  print_Dop(id_src->str, OP_STR_SIZE, "0x%x", offset);
  decode_op_r(id_dest, decinfo.isa.instr.rd, false);
}

make_DHelper(B){
  decode_op_r(id_src, decinfo.isa.instr.rs1, true);
  decode_op_r(id_src2, decinfo.isa.instr.rs2, true);
  print_Dop(id_src->str, OP_STR_SIZE, "0x%x", decinfo.isa.instr.rs1);
  print_Dop(id_src2->str, OP_STR_SIZE, "0x%x", decinfo.isa.instr.rs2);
  int32_t offset =
      (decinfo.isa.instr.simm12 << 12) | (decinfo.isa.instr.imm11 << 11) |
      (decinfo.isa.instr.imm10_5 << 5) | (decinfo.isa.instr.imm4_1 << 1);
  decode_op_i(id_dest, offset, true);
}

  

make_DHelper(R){
  decode_op_r(id_src, decinfo.isa.instr.rs1, true);
  decode_op_r(id_src2, decinfo.isa.instr.rs2, true);
  print_Dop(id_src->str, OP_STR_SIZE, "0x%x", decinfo.isa.instr.rs1);
  print_Dop(id_src2->str, OP_STR_SIZE, "0x%x", decinfo.isa.instr.rs2);
  decode_op_r(id_dest,decinfo.isa.instr.rd,false);
}

make_DHelper(ld) {
  decode_op_r(id_src, decinfo.isa.instr.rs1, true);
  decode_op_i(id_src2, decinfo.isa.instr.simm11_0, true);
  print_Dop(id_src->str, OP_STR_SIZE, "%d(%s)", id_src2->val, reg_name(id_src->reg, 4));
  rtl_add(&id_src->addr, &id_src->val, &id_src2->val);
  decode_op_r(id_dest, decinfo.isa.instr.rd, false);
}

  
make_DHelper(st) {
  decode_op_r(id_src, decinfo.isa.instr.rs1, true);
  int32_t simm = (decinfo.isa.instr.simm11_5 << 5) | decinfo.isa.instr.imm4_0;
  decode_op_i(id_src2, simm, true);
  print_Dop(id_src->str, OP_STR_SIZE, "%d(%s)", id_src2->val, reg_name(id_src->reg, 4));
  rtl_add(&id_src->addr, &id_src->val, &id_src2->val);
  decode_op_r(id_dest, decinfo.isa.instr.rs2, true);
}
```

然后填写op_code_table完成执行部分的代码

```c
#include "cpu/exec.h"

make_EHelper(lui) {
  rtl_sr(id_dest->reg, &id_src->val, 4);

  print_asm_template2(lui);
}

make_EHelper(auipc){
  rtl_add(&id_dest->val, &cpu.pc, &id_src->val);
  rtl_sr(id_dest->reg, &id_dest->val, 4);

  print_asm_template2(auipc);
}


make_EHelper(imm){
  switch(decinfo.isa.instr.funct3){
    case 0:                                              // addi
      rtl_add(&id_dest->val, &id_src->val, &id_src2->val);
      rtl_sr(id_dest->reg, &id_dest->val, 4);
      print_asm_template2(addi);
      break;
    case 1:                                               //slli
      rtl_shl(&id_dest->val, &id_src->val, &id_src2->reg);
      rtl_sr(id_dest->reg, &id_dest->val, 4);
      print_asm_template2(slli);
      break;
    case 2:                                                 //slti
      id_dest->val = (signed)id_src->val < (signed)id_src2->val;
      rtl_sr(id_dest->reg, &id_dest->val, 4);
      print_asm_template2(slti);
      break;
    case 3:                                              //sltiu
      id_dest->val = (unsigned)id_src->val < (unsigned)id_src2->val;
      rtl_sr(id_dest->reg, &id_dest->val, 4);
      print_asm_template2(sltiu);
      break;
    case 4:                                              //xori
      rtl_xor(&id_dest->val, &id_src->val, &id_src2->val);
      rtl_sr(id_dest->reg, &id_dest->val, 4);
      print_asm_template2(xori);
      break;
    case 5:                                             // srli&&srai
      if (decinfo.isa.instr.funct7 == 0b0000000) {    // srli
        rtl_shr(&id_dest->val,&id_src->val,&id_src2->reg);
        rtl_sr(id_dest->reg,&id_dest->val,4);
        print_asm_template2(srli);
      } else if (decinfo.isa.instr.funct7 == 0b0100000) {  // srai
        rtl_sar(&id_dest->val, &id_src->val, &id_src2->reg);
        rtl_sr(id_dest->reg, &id_dest->val, 4);
        print_asm_template2(srai);
      }
      break;
    case 6:                                               // ori
      rtl_or(&id_dest->val, &id_src->val, &id_src2->val);
      rtl_sr(id_dest->reg, &id_dest->val, 4);
      print_asm_template2(ori);
      break;
    case 7:                                             // andi
      rtl_and(&id_dest->val, &id_src->val, &id_src2->val);
      rtl_sr(id_dest->reg, &id_dest->val, 4);
      print_asm_template2(andi);
      break;
  }
}




make_EHelper(reg){
  switch (decinfo.isa.instr.funct3) {
    case 0:                                       // add  &&  sub  &&  mul
      if (decinfo.isa.instr.funct7 == 0b0000000) {        // add
        rtl_add(&id_dest->val, &id_src->val, &id_src2->val);
        rtl_sr(id_dest->reg, &id_dest->val, 4);
        print_asm_template3(add);
      } else if (decinfo.isa.instr.funct7 == 0b0100000) {  // sub
        rtl_sub(&id_dest->val, &id_src->val, &id_src2->val);
        rtl_sr(id_dest->reg, &id_dest->val, 4);
        print_asm_template3(sub);
      } else if (decinfo.isa.instr.funct7 == 0b0000001) {  // mul
        rtl_imul_lo(&id_dest->val, &id_src->val, &id_src2->val);
        rtl_sr(id_dest->reg, &id_dest->val, 4);
        print_asm_template3(mul);
      }
      break;
    case 1:                                             // sll&&mulh
      if (decinfo.isa.instr.funct7 == 0b0000000) {        // sll
        rtl_shl(&id_dest->val, &id_src->val, &id_src2->val);
        rtl_sr(id_dest->reg, &id_dest->val, 4);
        print_asm_template3(sll);
      } else if (decinfo.isa.instr.funct7 == 0b0000001) {  // mulh
        rtl_imul_hi(&id_dest->val, &id_src->val, &id_src2->val);
        rtl_sr(id_dest->reg, &id_dest->val, 4);
        print_asm_template3(mulh);
      }
      break;
    case 2:                                                  // slt
      id_dest->val = (signed)id_src->val < (signed)id_src2->val;
      rtl_sr(id_dest->reg, &id_dest->val, 4);
      print_asm_template3(slt);
      break;
    case 3:                                               // sltu
      id_dest->val = (unsigned)id_src->val < (unsigned)id_src2->val;
      rtl_sr(id_dest->reg, &id_dest->val, 4);
      print_asm_template3(sltu);
      break;
    case 4:                                              // xor&&div
      if (decinfo.isa.instr.funct7 == 0b0000000) {          // xor
        rtl_xor(&id_dest->val, &id_src->val, &id_src2->val);
        rtl_sr(id_dest->reg, &id_dest->val, 4);
        print_asm_template3(xor);
      } else if (decinfo.isa.instr.funct7 == 0b0000001) {   // div
        rtl_idiv_q(&id_dest->val, &id_src->val, &id_src2->val);
        rtl_sr(id_dest->reg, &id_dest->val, 4);
        print_asm_template3(div);
      }
      break;
    case 5:                                           // srl&&sra&&divu
      if (decinfo.isa.instr.funct7 == 0b0000000) {    // srl
        rtl_shr(&id_dest->val, &id_src->val, &id_src2->val);
        rtl_sr(id_dest->reg, &id_dest->val, 4);
        print_asm_template2(srl);
      } else if (decinfo.isa.instr.funct7 == 0b0100000) {  // sra
        rtl_sar(&id_dest->val, &id_src->val, &id_src2->val);
        rtl_sr(id_dest->reg, &id_dest->val, 4);
        print_asm_template2(sra);
      } else if (decinfo.isa.instr.funct7 == 0b0000001) {  // divu
        rtl_div_q(&id_dest->val, &id_src->val, &id_src2->val);
        rtl_sr(id_dest->reg, &id_dest->val, 4);
        print_asm_template3(divu);
      }
      break;
    case 6:                                         // or&&rem
      if (decinfo.isa.instr.funct7 == 0b0000000) {  // or
        rtl_or(&id_dest->val, &id_src->val, &id_src2->val);
        rtl_sr(id_dest->reg, &id_dest->val, 4);
        print_asm_template3(or);
      } else if (decinfo.isa.instr.funct7 == 0b0000001) {  // rem
        rtl_idiv_r(&id_dest->val, &id_src->val, &id_src2->val);
        rtl_sr(id_dest->reg, &id_dest->val, 4);
        print_asm_template3(rem);
      }
      break;
    case 7:                                        // and&&remu
      if (decinfo.isa.instr.funct7 == 0b0000000) {  // and
        rtl_and(&id_dest->val, &id_src->val, &id_src2->val);
        rtl_sr(id_dest->reg, &id_dest->val, 4);
        print_asm_template3(and);
      } else if (decinfo.isa.instr.funct7 == 0b0000001) {  // remu
        rtl_div_r(&id_dest->val, &id_src->val, &id_src2->val);
        rtl_sr(id_dest->reg, &id_dest->val, 4);
        print_asm_template3(remu);
      }
      break;
  }
}
```




```c
#include "cpu/exec.h"



make_EHelper(jal) {
  uint32_t addr = cpu.pc + 4;
  rtl_sr(id_dest->reg, &addr, 4);
  rtl_add(&decinfo.jmp_pc, &cpu.pc, &id_src->val);
  rtl_j(decinfo.jmp_pc);

  print_asm_template2(jal);
}

make_EHelper(jalr){
  uint32_t addr = cpu.pc + 4;
  rtl_sr(id_dest->reg, &addr, 4);
  decinfo.jmp_pc = (id_src->val + id_src2->val) & ~1;
  rtl_j(decinfo.jmp_pc);

  difftest_skip_dut(1, 2);  // difftest

  print_asm_template2(jalr);
}



make_EHelper(branch){
  decinfo.jmp_pc = cpu.pc + id_dest->val;
  switch (decinfo.isa.instr.funct3) {
    case 0:                                                            // beq
      rtl_jrelop(RELOP_EQ, &id_src->val, &id_src2->val, decinfo.jmp_pc);
      print_asm_template2(beq);
      break;
    case 1:                                                            // bne
      rtl_jrelop(RELOP_NE, &id_src->val, &id_src2->val, decinfo.jmp_pc);
      print_asm_template2(bne);
      break;
    case 4:                                                            // blt
      rtl_jrelop(RELOP_LT, &id_src->val, &id_src2->val, decinfo.jmp_pc);
      print_asm_template2(blt);
      break;
    case 5:                                                           // bge
      rtl_jrelop(RELOP_GE, &id_src->val, &id_src2->val, decinfo.jmp_pc);
      print_asm_template2(bge);
      break;
    case 6:                                                           // bltu
      rtl_jrelop(RELOP_LTU, &id_src->val, &id_src2->val, decinfo.jmp_pc);
      print_asm_template2(bltu);
      break;
    case 7:                                                           // bgeu
      rtl_jrelop(RELOP_GEU, &id_src->val, &id_src2->val, decinfo.jmp_pc);
      print_asm_template2(bgeu);
      break;
  }
}

```



```c
#include "cpu/exec.h"
#include "all-instr.h"

static OpcodeEntry load_table [8] = {
  EX(lb), EX(lh), EXW(ld, 4), EMPTY, EXW(ld,1), EXW(ld,2), EMPTY, EMPTY
};

static make_EHelper(load) {
  decinfo.width = load_table[decinfo.isa.instr.funct3].width;
  idex(pc, &load_table[decinfo.isa.instr.funct3]);
}

static OpcodeEntry store_table [8] = {
  EXW(st,1), EXW(st,2), EXW(st, 4), EMPTY, EMPTY, EMPTY, EMPTY, EMPTY
};

static make_EHelper(store) {
  decinfo.width = store_table[decinfo.isa.instr.funct3].width;
  idex(pc, &store_table[decinfo.isa.instr.funct3]);
}

static OpcodeEntry opcode_table [32] = {
  /* b00 */ IDEX(ld, load), EMPTY, EMPTY, EMPTY, IDEX(I, imm), IDEX(U, auipc), EMPTY, EMPTY,
  /* b01 */ IDEX(st, store), EMPTY, EMPTY, EMPTY, IDEX(R, reg), IDEX(U, lui), EMPTY, EMPTY,
  /* b10 */ EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
  /* b11 */ IDEX(B, branch), IDEX(I, jalr), EX(nemu_trap), IDEX(J, jal), EMPTY, EMPTY, EMPTY, EMPTY,
};

void isa_exec(vaddr_t *pc) {
  decinfo.isa.instr.val = instr_fetch(pc, 4);
  assert(decinfo.isa.instr.opcode1_0 == 0x3);
  idex(pc, &opcode_table[decinfo.isa.instr.opcode6_2]);
}

```


```c
#include "cpu/exec.h"

make_EHelper(ld) {
  rtl_lm(&s0, &id_src->addr, decinfo.width);
  rtl_sr(id_dest->reg, &s0, 4);

  switch (decinfo.width) {
    case 4: print_asm_template2(lw); break;
    case 2: print_asm_template2(lhu); break;
    case 1: print_asm_template2(lbu); break;
    default: assert(0);
  }
}

make_EHelper(st) {
  rtl_sm(&id_src->addr, &id_dest->val, decinfo.width);

  switch (decinfo.width) {
    case 4: print_asm_template2(sw); break;
    case 2: print_asm_template2(sh); break;
    case 1: print_asm_template2(sb); break;
    default: assert(0);
  }
}

make_EHelper(lh){
  rtl_lm(&s0, &id_src->addr, 2);
  rtl_sext(&s1, &s0, 2);
  rtl_sr(id_dest->reg, &s1, 4);
  print_asm_template2(lh);
}

make_EHelper(lb){
  rtl_lm(&s0, &id_src->addr, 1);
  rtl_sext(&s1, &s0, 1);
  rtl_sr(id_dest->reg, &s1, 4);
  print_asm_template2(lb);
}

```


填写opcode_table如下

```c
#include "cpu/exec.h"
#include "all-instr.h"

static OpcodeEntry load_table [8] = {
  EX(lb), EX(lh), EXW(ld, 4), EMPTY, EXW(ld,1), EXW(ld,2), EMPTY, EMPTY
};

static make_EHelper(load) {
  decinfo.width = load_table[decinfo.isa.instr.funct3].width;
  idex(pc, &load_table[decinfo.isa.instr.funct3]);
}

static OpcodeEntry store_table [8] = {
  EXW(st,1), EXW(st,2), EXW(st, 4), EMPTY, EMPTY, EMPTY, EMPTY, EMPTY
};

static make_EHelper(store) {
  decinfo.width = store_table[decinfo.isa.instr.funct3].width;
  idex(pc, &store_table[decinfo.isa.instr.funct3]);
}

static OpcodeEntry opcode_table [32] = {
  /* b00 */ IDEX(ld, load), EMPTY, EMPTY, EMPTY, IDEX(I, imm), IDEX(U, auipc), EMPTY, EMPTY,
  /* b01 */ IDEX(st, store), EMPTY, EMPTY, EMPTY, IDEX(R, reg), IDEX(U, lui), EMPTY, EMPTY,
  /* b10 */ EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY,
  /* b11 */ IDEX(B, branch), IDEX(I, jalr), EX(nemu_trap), IDEX(J, jal), EMPTY, EMPTY, EMPTY, EMPTY,
};

void isa_exec(vaddr_t *pc) {
  decinfo.isa.instr.val = instr_fetch(pc, 4);
  assert(decinfo.isa.instr.opcode1_0 == 0x3);
  idex(pc, &opcode_table[decinfo.isa.instr.opcode6_2]);
}

```



要完成ld-store还要完成rtl-sext 即寄存器扩展指令
```c
static inline void rtl_sext(rtlreg_t* dest, const rtlreg_t* src1, int width) {
  // dest <- signext(src1[(width * 8 - 1) .. 0])
  // TODO();
  int32_t temp = *src1;
  switch(width) {
    case 4: *dest = *src1; return;
    case 3: temp = temp <<  8; *dest = temp >>  8; return; 
    case 2: temp = temp << 16; *dest = temp >> 16; return; 
    case 1: temp = temp << 24; *dest = temp >> 24; return;
    default: assert(0);
  }
}
```


![](./pa-img/res.png)

完成所有指令后就差string测试无法通过。需要实现有关string的一系列函数。
