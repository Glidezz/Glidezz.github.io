---
title: pa3
description: pa3
pubDate: 2024-10-11
series: pa
---

## CTE
按照实验指导书的要求，首先要完成以下几个任务。
###  设置异常入口地址
- 对于riscv32来说, 直接将异常入口地址设置到stvec寄存器中即可.
后续要完成系统调用。因此要在这里识别系统调用并保存。

```c

_Context* __am_irq_handle(_Context *c) {
  _Context *next = c;
  // Todo: finished the task
  if (user_handler) {
    _Event ev = {0};
    switch (c->cause) {
      case -1: ev.event = _EVENT_YIELD; break;
      case 0:
      case 1:
      case 2:
      case 3:
      case 4:
      case 7:
      case 8:
      case 9:
      case 13: ev.event = _EVENT_SYSCALL; break;
      default: ev.event = _EVENT_ERROR; break;
    }

    next = user_handler(ev, c);
    if (next == NULL) {
      next = c;
    }
  }

  return next;
}

int _cte_init(_Context*(*handler)(_Event, _Context*)) {
  // initialize exception entry
  asm volatile("csrw stvec, %0" : : "r"(__am_asm_trap));

  // register event handler
  user_handler = handler;

  return 0;
}
```

###  触发自陷操作

这里要将地址保存斤stevc寄存器中，这里要将相关的寄存器添加进cpu结构体中。
```c
typedef struct {
  struct {
    rtlreg_t _32;
  } gpr[32];

  vaddr_t pc;

  rtlreg_t sepc;     // 存放触发异常的PC
  rtlreg_t sstatus;  // 存放处理器的状态
  rtlreg_t scause;   // 存放触发异常的原因
  rtlreg_t stvec;    // 异常入口地址
  // 加入寄存器

} CPU_state;

void raise_intr(uint32_t NO, vaddr_t epc) {
  /* TODO: Trigger an interrupt/exception with ``NO''.
   * That is, use ``NO'' to index the IDT.
   */
  cpu.sepc = epc;
  cpu.scause = NO;
  rtl_j(cpu.stvec);
  //异常返回
}
```

### 保存上下文

这里要根据trap.S内容重新组织context结构体。后面要修改参数的顺序使之与riscv规定的参数保存的寄存器顺序一致。根据如下

```c
// navy-apps/libs/libos/src/nanos.c
intptr_t _syscall_(int type, intptr_t a0, intptr_t a1, intptr_t a2) {
  // ...
  asm volatile(SYSCALL : "=r"(RET_VAR): "r"(_type), "r"(_arg0), "r"(_arg1), "r"(_arg2));
  return RET_VAR;
}
```



```

```c
struct _Context {
  uintptr_t gpr[32], cause, status, epc;
  struct _AddressSpace *as;
};

//改变顺序 "a7", "a0", "a1", "a2", "a0"
#define GPR1 gpr[17]
#define GPR2 gpr[10]
#define GPR3 gpr[11]
#define GPR4 gpr[12]
#define GPRx gpr[10]
```

### 事件分发

这里要识别出`_EVENT_YIELD`的事件，然后只需打印一个log。后续需要处理syscall系统调用，因此不再赘述。
```c

_Context* do_syscall(_Context *c);

static _Context* do_event(_Event e, _Context* c) {
  switch (e.event) {
    case _EVENT_YIELD:
      Log("self trap");
      break;
    case _EVENT_SYSCALL: 
      do_syscall(c);        
      break;
    default: panic("Unhandled event ID = %d", e.event);
  }

  return NULL;
}

void init_irq(void) {
  Log("Initializing interrupt/exception handler...");
  _cte_init(do_event);
}
```

###  恢复上下文

这里要实现4个新指令，其中部分是伪指令，参考pa2。

```c
#define SEPC 0x141
#define SSTATUS 0x100
#define SCAUSE 0x142
#define STVEC 0x105

void raise_intr(uint32_t NO, vaddr_t epc);

//实现四个新的指令
make_EHelper(sys){
  switch (decinfo.isa.instr.funct3) {
    case 0: {                            // ecall&&sret
      if (decinfo.isa.instr.simm11_0 == 0) {  // ecall
        raise_intr(reg_l(17),cpu.pc);
      } else if (decinfo.isa.instr.simm11_0 == 0b000100000010) {  // sret
        rtl_j(cpu.sepc + 4);
      }
      break;
    }
    case 1:{ // csrrw
      switch (decinfo.isa.instr.csr) {
        case SEPC:
          t0 = cpu.sepc;
          cpu.sepc = id_src->val;
          rtl_sr(id_dest->reg, &t0, 4);
          break;
        case SSTATUS:
          t0 = cpu.sstatus;
          cpu.sstatus = id_src->val;
          rtl_sr(id_dest->reg, &t0, 4);
          break;
        case SCAUSE:
          t0 = cpu.scause;
          cpu.scause = id_src->val;
          rtl_sr(id_dest->reg, &t0, 4);
          break;
        case STVEC:
          t0 = cpu.stvec;
          cpu.stvec = id_src->val;
          rtl_sr(id_dest->reg, &t0, 4);
          break;
      }
      print_asm_template3(csrrw);
      break;
    }
    case 2:{ //csrrs
      switch (decinfo.isa.instr.csr) {
        case SEPC:
          t0 = cpu.sepc;
          cpu.sepc = t0 | id_src->val;
          rtl_sr(id_dest->reg, &t0, 4);
          break;
        case SSTATUS:
          t0 = cpu.sstatus;
          cpu.sstatus = t0 | id_src->val;
          rtl_sr(id_dest->reg, &t0, 4);
          break;
        case SCAUSE:
          t0 = cpu.scause;
          cpu.scause = t0 | id_src->val;
          rtl_sr(id_dest->reg, &t0, 4);
          break;
        case STVEC:
          t0 = cpu.stvec;
          cpu.stvec = t0 | id_src->val;
          rtl_sr(id_dest->reg, &t0, 4);
          break;
      }
      print_asm_template3(csrrs);
      break;
    }
  }
}
```


## 系统调用

系统调用相关的部分代码已经实现，因此我们要完成处理系统调用部分的代码。

在nano.c中定义了调用syacall的代码，因此我们调用`_SYSCALL_`实现系统调用。
### 调用syscall

```c

intptr_t _syscall_(intptr_t type, intptr_t a0, intptr_t a1, intptr_t a2) {
  register intptr_t _gpr1 asm (GPR1) = type;
  register intptr_t _gpr2 asm (GPR2) = a0;
  register intptr_t _gpr3 asm (GPR3) = a1;
  register intptr_t _gpr4 asm (GPR4) = a2;
  register intptr_t ret asm (GPRx);
  asm volatile (SYSCALL : "=r" (ret) : "r"(_gpr1), "r"(_gpr2), "r"(_gpr3), "r"(_gpr4));
  return ret;
}

void _exit(int status) {
  _syscall_(SYS_exit, status, 0, 0);
  while (1);
}

int _open(const char *path, int flags, mode_t mode) {
  int ret = _syscall_(SYS_open, (intptr_t)path, flags, mode);
  return ret;
}

int _write(int fd, void *buf, size_t count) {
  int ret = _syscall_(SYS_write, fd, (intptr_t)buf, count);
  // _exit(SYS_write);
  return ret;
}

void *_sbrk(intptr_t increment) {
  static int programBrk = 0;
  if (programBrk == 0) {
    programBrk = &end;
  }
  int ret = programBrk;
  if (!_syscall_(SYS_brk, programBrk + increment, 0, 0)) {
    programBrk += increment;
    return (void *)ret;
  }
  return (void *)-1;
}

int _read(int fd, void *buf, size_t count) {
  int ret = _syscall_(SYS_read, fd, (intptr_t)buf, count);
  return ret;
}

int _close(int fd) {
  int ret = _syscall_(SYS_close, fd, 0, 0);
  return ret;
}

off_t _lseek(int fd, off_t offset, int whence) {
  off_t ret = _syscall_(SYS_lseek, fd, (intptr_t)offset, whence);
  return ret;
}

int _execve(const char *fname, char * const argv[], char *const envp[]) {
  //_exit(SYS_execve);
  int ret = _syscall_(SYS_execve, fname, (intptr_t)argv, (intptr_t)envp);
  return ret;
}
```

### syscall


在syscall.c中根据系统调用号调用相应的系统调用。

```c

extern void naive_uload(PCB *pcb, const char *filename);
static int programBrk;

int do_open(const char*path, int flags, int mode){
    int res = fs_open(path, flags, mode);
    return res;
}

int do_close(int fd){
    int res = fs_close(fd);
    return res;
}

int do_read(int fd, void*buf, size_t count){
    if(fd>=0 && fd<=2){
        return 0;
    }
    int res = fs_read(fd, buf, count);
    return res;
}

int do_write(int fd, const void*buf, size_t count){
    int res = fs_write(fd, buf, count);
    return res;
}

size_t do_lseek(int fd, size_t offset, int whence){
    size_t res = fs_lseek(fd, offset, whence);
    return res;
}

int do_brk(int addr){
    programBrk = addr;
    return 0;
}

_Context* do_syscall(_Context *c) {
  uintptr_t a[4];
  a[0] = c->GPR1;
  a[1] = c->GPR2;
  a[2] = c->GPR3;
  a[3] = c->GPR4;

  switch (a[0]) {
      case SYS_exit:
          naive_uload(NULL,"/bin/init");
          _halt(a[1]);
          break;
      case SYS_yield:
          _yield();
          c->GPRx = 0;
          break;
      case SYS_write:
          c->GPRx = do_write(a[1], (void*)(a[2]), a[3]);
          break;
      case SYS_read:
          c->GPRx = do_read(a[1], (void*)(a[2]), a[3]);
          break;
      case SYS_lseek:
          c->GPRx = do_lseek(a[1], a[2], a[3]);
          break;
      case SYS_open:
          c->GPRx = do_open((const char *)a[1], a[2], a[3]);
          break;
      case SYS_close:
          c->GPRx = do_close(a[1]);
          break;
      case SYS_brk:
          c->GPRx = do_brk(a[1]);
          break;
      case SYS_execve:
          printf("%s\n", a[1]);
          naive_uload(NULL, (const char*)a[1]);
          c->GPR2 = SYS_exit;
          do_syscall(c);
          break;
    default: panic("Unhandled syscall ID = %d", a[0]);
  }

  return NULL;
}
```

### 文件系统

> 这里需要首先实现`loader`和以及调用`native_loader` ， 实现文件系统后要重新loader，因此这里直接介绍文件系统。

首先实现以下函数

```c

int fs_open(const char *pathname, int flags, int mode){
    for(int i = 3; i < NR_FILES;i++){
        if(strcmp(pathname, file_table[i].name) == 0){
            return i;
        }
    }
    assert(0 && "Can't find file");
}

size_t fs_read(int fd, void *buf, size_t len){
    if(fd>=3 &&(file_table[fd].open_offset+len >= file_table[fd].size)){
        if(file_table[fd].size > file_table[fd].open_offset)
            len = file_table[fd].size - file_table[fd].open_offset;
        else
            len = 0;
    }
    if(!file_table[fd].read){
        ramdisk_read(buf, file_table[fd].disk_offset + file_table[fd].open_offset, len);
    }
    else{
        len = file_table[fd].read(buf, file_table[fd].disk_offset + file_table[fd].open_offset, len);
    }
    file_table[fd].open_offset += len;
    return len;
}

size_t fs_write(int fd, const void *buf, size_t len){
    if(fd>=5 &&(file_table[fd].open_offset+len > file_table[fd].size)){
        if(file_table[fd].size > file_table[fd].open_offset)
            len = file_table[fd].size - file_table[fd].open_offset;
        else
            len = 0;
    }
    if(!file_table[fd].write){
        ramdisk_write(buf, file_table[fd].disk_offset + file_table[fd].open_offset, len);
    }
    else{
        file_table[fd].write(buf, file_table[fd].disk_offset + file_table[fd].open_offset, len);
    }
    file_table[fd].open_offset += len;
    return len;
}

size_t fs_lseek(int fd, size_t offset, int whence){
    switch(whence){
        case SEEK_SET:
            file_table[fd].open_offset = offset;
            break;
        case SEEK_CUR:
            file_table[fd].open_offset += offset;
            break;
        case SEEK_END:
            file_table[fd].open_offset = file_table[fd].size + offset;
            break;
    }
    return file_table[fd].open_offset;
}

int fs_close(int fd){
    file_table[fd].open_offset = 0;
    return 0;
}

void init_fs() {
  // TODO: initialize the size of /dev/fb
  int fb = fs_open("/dev/fb", 0, 0);
  file_table[fb].size = screen_width()*screen_height()*4;
}
```



### 实现loader

这里需要了解elf。然后调用文件系统实现loader函数。

```c

static uintptr_t loader(PCB *pcb, const char *filename) {
  Elf_Ehdr Ehdr;
  int fd = fs_open(filename, 0, 0);
  fs_lseek(fd, 0, SEEK_SET);
  fs_read(fd, &Ehdr, sizeof(Ehdr));

  for(int i = 0; i < Ehdr.e_phnum;i++){
      Elf_Phdr Phdr;
      fs_lseek(fd, Ehdr.e_phoff + i*Ehdr.e_phentsize, SEEK_SET);
      //printf("res:%d\n", res);
      fs_read(fd, &Phdr, sizeof(Phdr));

      if(!(Phdr.p_type & PT_LOAD)){
          continue;
      }
      fs_lseek(fd, Phdr.p_offset, SEEK_SET);
      fs_read(fd, (void*)Phdr.p_vaddr, Phdr.p_filesz);
      for(unsigned int i = Phdr.p_filesz; i < Phdr.p_memsz;i++){
          ((char*)Phdr.p_vaddr)[i] = 0;
      }
  
  }

  return Ehdr.e_entry;
}
```

## 虚拟文件系统

最后实现虚拟文件系统。将各种设备抽象为文件或字节流。这里是不支持输入的，因此sdtin对应的写入是invalid_read

```c
static Finfo file_table[] __attribute__((used)) = {
  {"stdin", 0, 0, 0, invalid_read, invalid_write},
  {"stdout", 0, 0, 0, invalid_read, serial_write},
  {"stderr", 0, 0, 0, invalid_read, serial_write},
  {"/dev/events", 0xffffff, 0, 0, events_read, invalid_write},
  {"/dev/tty", 0, 0, 0, invalid_read, serial_write},
  {"/dev/fb", 0, 0, 0, invalid_read, fb_write},
  {"/dev/fbsync", 0xffff, 0, 0, invalid_read, fbsync_write},
  {"/proc/dispinfo", 128, 0, 0, dispinfo_read, invalid_write},
#include "files.h"
};
```


同时实现相关的函数

```c

extern int screen_width();
extern int screen_height();

size_t __am_input_read(uintptr_t reg, void *buf, size_t size);
size_t __am_timer_read(uintptr_t reg, void *buf, size_t size);

size_t serial_write(const void *buf, size_t offset, size_t len) {
    for(int i = 0; i < len;i++){
      _putc(((char *)buf)[i]);
    }
  return len;
}

#define NAME(key) \
  [_KEY_##key] = #key,

static const char *keyname[256] __attribute__((used)) = {
  [_KEY_NONE] = "NONE",
  _KEYS(NAME)
};

size_t events_read(void *buf, size_t offset, size_t len) {
  int kc = read_key();
  char tmp[3] = "ku";
  if ((kc & 0xfff) == _KEY_NONE) {
    int time = uptime();
    len = sprintf(buf, "t %d\n", time);
    }
  else{
      if (kc & 0x8000) tmp[1] = 'd';
      len = sprintf(buf, "%s %s\n", tmp, keyname[kc & 0xfff]);
  }
  return len;
}

static char dispinfo[128] __attribute__((used)) = {};

size_t dispinfo_read(void *buf, size_t offset, size_t len) {
    len = sprintf(buf, dispinfo + offset);
  return len;
}

size_t fb_write(const void *buf, size_t offset, size_t len) {
  int x = (offset / 4) % screen_width();
  int y = (offset / 4) / screen_width();
  draw_sync();
  draw_rect((uint32_t *)buf, x, y, len / 4, 1);
  return len;
}

size_t fbsync_write(const void *buf, size_t offset, size_t len) {
  draw_sync();
  return 0;
}

void init_device() {
  Log("Initializing devices...");
  _ioe_init();

  sprintf(dispinfo, "WIDTH:%d\nHEIGHT:%d\n", screen_width(), screen_height());
}
```


## run games

> 我的游戏的帧率好低，加载动画要好久。