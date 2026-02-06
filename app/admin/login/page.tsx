import { LoginForm } from "./login-form";

export default function LoginPage() {
  const debugMode = process.env.DEBUG_ADMIN_PANEL === "true";

  return <LoginForm debugMode={debugMode} />;
}
