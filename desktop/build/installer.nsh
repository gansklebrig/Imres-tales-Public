; Verknüpfung auf dem Desktop nur bei der allerersten Installation anlegen – danach nie wieder anfassen.
; So bleiben ein selbst gesetztes Tastenkürzel, ein eigenes Symbol oder ein verschobener Platz erhalten.
; (electron-builder selbst legt keine Desktop-Verknüpfung an: createDesktopShortcut ist aus.)
!macro customInstall
  ${ifNot} ${isUpdated}
    ${ifNot} ${FileExists} "$DESKTOP\Heldensturm.lnk"
      ReadRegStr $0 SHELL_CONTEXT "Software\Heldensturm" "VerknuepfungAngelegt"
      ${if} $0 != "1"
        CreateShortCut "$DESKTOP\Heldensturm.lnk" "$appExe" "" "$appExe" 0 "" "" "Heldensturm"
        ClearErrors
        WinShell::SetLnkAUMI "$DESKTOP\Heldensturm.lnk" "${APP_ID}"
      ${endIf}
    ${endIf}
    WriteRegStr SHELL_CONTEXT "Software\Heldensturm" "VerknuepfungAngelegt" "1"
  ${endIf}
!macroend

; Beim echten Deinstallieren (nicht beim Update) die Verknüpfung wieder entfernen
!macro customUnInstall
  ${ifNot} ${isUpdated}
    ${if} ${FileExists} "$DESKTOP\Heldensturm.lnk"
      WinShell::UninstShortcut "$DESKTOP\Heldensturm.lnk"
      Delete "$DESKTOP\Heldensturm.lnk"
    ${endIf}
    DeleteRegKey SHELL_CONTEXT "Software\Heldensturm"
  ${endIf}
!macroend
