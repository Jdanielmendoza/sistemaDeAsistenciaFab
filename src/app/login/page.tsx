import { LoginForm } from "@/components/login-form"
import logoFablab from "@/app/login/images/logoFablab.png"
export default function LoginPage() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Lado izquierdo: logo y gradiente */}
      <div className="relative hidden lg:block bg-gradient-to-br from-[#a149d5] via-[#6d6de9] to-[#00b4c0]">
        <img
          src="/logoFablab.png"
          alt="FabLab logo"
          className="absolute inset-0 m-auto w-3/4 max-w-md object-contain"
        />
      </div>

      {/* Lado derecho: formulario */}
      <div className="flex items-center justify-center p-6 md:p-10 bg-white dark:bg-background">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-[#6d6de9]">Bienvenido</h1>
            <p className="text-muted-foreground">Ingresa tus credenciales para continuar</p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
