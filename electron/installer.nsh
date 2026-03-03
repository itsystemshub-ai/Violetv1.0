!macro customInit
  ; Fuerza el cierre de la aplicación si está abierta para evitar que se bloqueen los archivos al instalar
  nsExec::ExecToStack 'taskkill /F /IM "Violet ERP.exe"'
!macroend
