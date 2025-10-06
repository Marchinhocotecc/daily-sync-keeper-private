import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";

const NotFound = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const tr = (k: string, fb: string) => (t(k) === k ? fb : t(k));

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-foreground">404</h1>
        <p className="text-xl text-muted-foreground mb-4">
          {tr('common.notFound', 'Oops! Pagina non trovata')}
        </p>
        <a href="/" className="text-primary hover:underline">
          {tr('common.backHome', 'Torna alla Home')}
        </a>
      </div>
    </div>
  );
};

export default NotFound;
