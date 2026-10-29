//go:build windows

package main

import (
	"fmt"
	"runtime"
	"syscall"
	"unsafe"
)

// ---------- Tastatur-Hook (Windows) ----------

var (
	user32             = syscall.NewLazyDLL("user32.dll")
	kernel32           = syscall.NewLazyDLL("kernel32.dll")
	setWindowsHookEx   = user32.NewProc("SetWindowsHookExW")
	callNextHookEx     = user32.NewProc("CallNextHookEx")
	getMessage         = user32.NewProc("GetMessageW")
	getModuleHandle    = kernel32.NewProc("GetModuleHandleW")
	setConsoleOutputCP = kernel32.NewProc("SetConsoleOutputCP")
	setConsoleTitle    = kernel32.NewProc("SetConsoleTitleW")
	hook               uintptr
)

type kbdll struct {
	VkCode, ScanCode, Flags, Time uint32
	Extra                         uintptr
}

func hookProc(nCode int, wParam uintptr, lParam uintptr) uintptr {
	if nCode >= 0 {
		k := (*kbdll)(unsafe.Pointer(lParam))
		runter := wParam == 0x100 || wParam == 0x104
		hoch := wParam == 0x101 || wParam == 0x105
		mu.Lock()
		if lernen && runter {
			lernen = false
			mu.Unlock()
			if c := vkZuCode(k.VkCode); c != "" {
				go setzeTaste(c, false)
			} else {
				fmt.Println("  Diese Taste geht leider nicht – bitte eine andere wählen (t + Enter).")
			}
			r, _, _ := callNextHookEx.Call(hook, uintptr(nCode), wParam, lParam)
			return r
		}
		if k.VkCode == zielVK {
			if runter && !gedrueckt {
				gedrueckt = true
				go senden(map[string]string{"art": "druck"})
			} else if hoch && gedrueckt {
				gedrueckt = false
				go senden(map[string]string{"art": "los"})
			}
		}
		mu.Unlock()
	}
	r, _, _ := callNextHookEx.Call(hook, uintptr(nCode), wParam, lParam)
	return r
}

func hookStarten() {
	runtime.LockOSThread()
	mod, _, _ := getModuleHandle.Call(0)
	cb := syscall.NewCallback(hookProc)
	h, _, err := setWindowsHookEx.Call(13 /* WH_KEYBOARD_LL */, cb, mod, 0)
	if h == 0 {
		fmt.Println("  Tastatur-Hook konnte nicht gestartet werden:", err)
		return
	}
	hook = h
	var msg [48]byte
	for {
		r, _, _ := getMessage.Call(uintptr(unsafe.Pointer(&msg[0])), 0, 0, 0)
		if int32(r) <= 0 {
			return
		}
	}
}

func konsoleEinrichten() {
	setConsoleOutputCP.Call(65001)
	if t, err := syscall.UTF16PtrFromString("Imres-Taste"); err == nil {
		setConsoleTitle.Call(uintptr(unsafe.Pointer(t)))
	}
}
