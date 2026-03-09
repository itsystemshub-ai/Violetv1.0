; Script de instalación NSIS para Violet ERP
; Cierra procesos activos antes de instalar

!macro customInit
  ; Cerrar Violet ERP si está ejecutándose
  nsExec::ExecToStack 'taskkill /F /IM "Violet ERP.exe" /T'
  Pop $0
  Pop $1
  
  ; Esperar un momento para que se cierre completamente
  Sleep 1000
!macroend

!macro customInstall
  ; Crear acceso directo en el escritorio
  CreateShortCut "$DESKTOP\Violet ERP.lnk" "$INSTDIR\Violet ERP.exe"
!macroend
