import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import notFoundSvg from "@/assets/illustrations/not-found.svg";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="screen-shell text-center">
      <div className="soft-panel flex w-full max-w-md flex-col items-center gap-4 rounded-[32px] p-8">
        <img src={notFoundSvg} alt="" className="mx-auto h-40 w-40 opacity-80" />
        <p className="section-kicker">Missing Screen</p>
        <h1 className="text-5xl font-bold tracking-tight">404</h1>
        <p className="text-muted-foreground">Page not found</p>
        <Button onClick={() => navigate("/")}>Go to Dashboard</Button>
      </div>
    </div>
  );
}
