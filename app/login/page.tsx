import Image from "next/image";
import { login } from "@/app/actions";
import { SubmitButton } from "@/app/submit-button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="login">
      <div className="login-card">
        <Image
          className="login-logo"
          src="/logo.jpg"
          alt="Aetermia"
          width={640}
          height={640}
          priority
        />

        <form action={login} className="stack">
          <label>
            Email
            <input name="email" type="email" required autoComplete="email" />
          </label>
          <label>
            Contraseña
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </label>

          {error ? (
            <p className="error">Email o contraseña incorrectos.</p>
          ) : null}

          <SubmitButton className="btn">Entrar</SubmitButton>
        </form>
      </div>
    </main>
  );
}
