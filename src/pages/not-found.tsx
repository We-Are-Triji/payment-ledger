import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import notFoundSvg from "@/assets/illustrations/not-found.svg";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-8 text-center">
      <img src={notFoundSvg} alt="" className="mx-auto h-40 w-40 opacity-80" />
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">Page not found</p>
      <Button onClick={() => navigate("/")}>Go to Dashboard</Button>
    </div>
  );
}
