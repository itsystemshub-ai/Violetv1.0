import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { Heart, Mail, Lock, Loader2 } from 'lucide-react'

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (data.success) {
        localStorage.setItem('accessToken', data.data.tokens.accessToken)
        localStorage.setItem('refreshToken', data.data.tokens.refreshToken)
        localStorage.setItem('user', JSON.stringify(data.data.user))
        window.location.href = '/dashboard'
      } else {
        setError(data.error?.message || 'Credenciales inválidas')
      }
    } catch (err) {
      setError('Error de conexión con el servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md relative backdrop-blur-sm bg-white/95 shadow-2xl border-white/20">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <div className="p-3 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-full shadow-lg">
              <Heart className="h-8 w-8 text-white" fill="white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
            Violet ERP
          </CardTitle>
          <CardDescription className="text-base">
            Sistema Empresarial Híbrido
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive" className="bg-red-50 border-red-200">
                <AlertDescription className="text-sm text-red-600">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Mail className="h-4 w-4 text-violet-600" />
                Usuario
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
                disabled={loading}
                className="h-11 border-gray-300 focus:border-violet-500 focus:ring-violet-500"
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Lock className="h-4 w-4 text-violet-600" />
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                className="h-11 border-gray-300 focus:border-violet-500 focus:ring-violet-500"
                autoComplete="current-password"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full h-11 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>

            <div className="w-full pt-4 border-t border-gray-200">
              <p className="text-xs text-center text-gray-500 mb-3">
                Credenciales de acceso
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-gray-50 rounded-lg p-2 text-center border border-gray-200">
                  <span className="text-gray-500">Usuario:</span>
                  <p className="font-mono font-medium text-gray-700 mt-1">admin</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center border border-gray-200">
                  <span className="text-gray-500">Contraseña:</span>
                  <p className="font-mono font-medium text-gray-700 mt-1">admin123</p>
                </div>
              </div>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default LoginPage
