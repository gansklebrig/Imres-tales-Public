//go:build !windows

package main

// Außerhalb von Windows gibt es keinen Tastatur-Hook – zum Testen lassen sich Drücken/Loslassen im Fenster mit „d“/„l“ auslösen.
func hookStarten()       {}
func konsoleEinrichten() {}
