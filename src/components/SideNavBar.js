import React from "react";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import { useTranslation } from "react-i18next";
import "./SideNavBar.css";
const SideNavBar = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const { t, i18n } = useTranslation();

  const languageOptions = [
    { label: '🇺🇸 EN', value: 'en' },
    { label: '🇧🇷 PT', value: 'pt' },
    { label: '🇩🇪 DE', value: 'de' },
    { label: '🇪🇸 ES', value: 'es' }
  ];

  const handleLogout = () => {
    signOut(auth).then(() => {
      navigate("/login");
    });
  };

  return (
    <div className="top-nav">
      <div className="nav-container">
        <div className="nav-left">
          <Dropdown 
            value={i18n.language} 
            options={languageOptions} 
            onChange={(e) => i18n.changeLanguage(e.value)} 
            className="language-selector" 
            style={{ minWidth: '100px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)' }}
          />
        </div>
        <div className="main-nav-links">
          <Button label={t('nav.home')} icon="pi pi-home" onClick={() => navigate("/")} className="nav-btn" />
          <Button label={t('song.add_title')} icon="pi pi-plus" onClick={() => navigate("/add")} className="nav-btn" />
          <Button label={t('nav.history')} icon="pi pi-calendar" onClick={() => navigate("/history")} className="nav-btn" />
        </div>
        <div className="nav-right">
          <Button label={t('nav.logout')} icon="pi pi-sign-out" onClick={handleLogout} className="p-button-danger nav-btn logout-btn" />
        </div>
      </div>
    </div>
  );
};

export default SideNavBar;