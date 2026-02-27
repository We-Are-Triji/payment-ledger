import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">Page not found</p>
      <Button onClick={() => navigate("/")}>Go to Dashboard</Button>
    </div>
  );
}
