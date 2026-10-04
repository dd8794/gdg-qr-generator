import { useEffect, useMemo, useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

const STORAGE_KEY = "gdg-qr-history-v2";

const DEFAULT_SETTINGS = {
    size: 280,
    fgColor: "#111827",
    bgColor: "#ffffff",
    level: "H",
    margin: 4,
};

const PRESETS = {
    Classic: {
        size: 280,
        fgColor: "#111827",
        bgColor: "#ffffff",
        level: "H",
        margin: 4,
    },
    Dark: {
        size: 280,
        fgColor: "#ffffff",
        bgColor: "#111827",
        level: "H",
        margin: 4,
    },
    "High Contrast": {
        size: 320,
        fgColor: "#000000",
        bgColor: "#ffffff",
        level: "H",
        margin: 6,
    },
};

const TYPE_LABELS = {
    url: "URL",
    text: "Plain Text",
    email: "Email",
    phone: "Phone Number",
    wifi: "Wi-Fi",
};

function escapeWifiValue(value) {
    return String(value)
        .replace(/\\/g, "\\\\")
        .replace(/;/g, "\\;")
        .replace(/,/g, "\\,")
        .replace(/:/g, "\\:");
}

function buildWifiString(ssid, password, security, hidden) {
    return `WIFI:T:${security};S:${escapeWifiValue(ssid)};P:${escapeWifiValue(
        password
    )};H:${hidden ? "true" : "false"};;`;
}

function getInitialHistory() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
}

function App() {
    const qrCanvasRef = useRef(null);

    const [type, setType] = useState("url");

    const [url, setUrl] = useState("");
    const [text, setText] = useState("");

    const [email, setEmail] = useState("");
    const [emailSubject, setEmailSubject] = useState("");
    const [emailBody, setEmailBody] = useState("");

    const [phone, setPhone] = useState("");

    const [wifiSSID, setWifiSSID] = useState("");
    const [wifiPassword, setWifiPassword] = useState("");
    const [wifiSecurity, setWifiSecurity] = useState("WPA");
    const [wifiHidden, setWifiHidden] = useState(false);

    const [settings, setSettings] = useState(DEFAULT_SETTINGS);

    const [history, setHistory] = useState(getInitialHistory);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [selectedPreset, setSelectedPreset] = useState("Classic");

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }, [history]);

    const rawValue = useMemo(() => {
        switch (type) {
            case "url":
                return url.trim();

            case "text":
                return text;

            case "email": {
                const params = new URLSearchParams();

                if (emailSubject.trim()) {
                    params.set("subject", emailSubject);
                }

                if (emailBody.trim()) {
                    params.set("body", emailBody);
                }

                const query = params.toString();

                return `mailto:${email.trim()}${query ? `?${query}` : ""}`;
            }

            case "phone":
                return phone.trim() ? `tel:${phone.trim()}` : "";

            case "wifi":
                if (!wifiSSID.trim()) return "";

                return buildWifiString(
                    wifiSSID.trim(),
                    wifiPassword,
                    wifiSecurity,
                    wifiHidden
                );

            default:
                return "";
        }
    }, [
        type,
        url,
        text,
        email,
        emailSubject,
        emailBody,
        phone,
        wifiSSID,
        wifiPassword,
        wifiSecurity,
        wifiHidden,
    ]);

    function validate() {
        const cleanUrl = url.trim();
        const cleanEmail = email.trim();
        const cleanPhone = phone.trim();
        const cleanSSID = wifiSSID.trim();

        if (type === "url") {
            if (!cleanUrl) {
                return "Please enter a URL.";
            }

            try {
                const parsed = new URL(cleanUrl);

                if (!["http:", "https:"].includes(parsed.protocol)) {
                    return "Please enter a valid HTTP or HTTPS URL.";
                }
            } catch {
                return "Please enter a valid URL, for example https://google.com";
            }
        }

        if (type === "text") {
            if (!text.trim()) {
                return "Please enter some text.";
            }
        }

        if (type === "email") {
            if (!cleanEmail) {
                return "Please enter an email address.";
            }

            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailPattern.test(cleanEmail)) {
                return "Please enter a valid email address.";
            }
        }

        if (type === "phone") {
            if (!cleanPhone) {
                return "Please enter a phone number.";
            }

            const digits = cleanPhone.replace(/\D/g, "");

            if (digits.length < 7) {
                return "Please enter a valid phone number.";
            }
        }

        if (type === "wifi") {
            if (!cleanSSID) {
                return "Please enter the Wi-Fi network name (SSID).";
            }

            if (wifiSecurity !== "nopass" && !wifiPassword) {
                return "Please enter the Wi-Fi password.";
            }
        }

        return "";
    }

    const validationError = validate();
    const qrIsValid = !validationError && Boolean(rawValue);

    function updateSetting(key, value) {
        setSettings((current) => ({
            ...current,
            [key]: value,
        }));

        setSelectedPreset("Custom");
        setNotice("");
    }

    function applyPreset(name) {
        setSettings(PRESETS[name]);
        setSelectedPreset(name);
        setNotice(`${name} preset applied.`);
        setError("");
    }

    function handleTypeChange(newType) {
        setType(newType);
        setError("");
        setNotice("");
    }

    function saveToHistory() {
        const currentError = validate();

        if (currentError) {
            setError(currentError);
            setNotice("");
            return;
        }

        const item = {
            id: Date.now(),
            type,
            label: TYPE_LABELS[type],
            value: rawValue,
            settings: { ...settings },
            createdAt: new Date().toLocaleString(),
            displayValue: getDisplayValue(),
        };

        setHistory((current) => {
            const withoutDuplicate = current.filter(
                (entry) => entry.value !== item.value || entry.type !== item.type
            );

            return [item, ...withoutDuplicate].slice(0, 10);
        });

        setNotice("QR code saved to Recent QR Codes.");
        setError("");
    }

    function getDisplayValue() {
        switch (type) {
            case "url":
                return url.trim();

            case "text":
                return text.trim();

            case "email":
                return email.trim();

            case "phone":
                return phone.trim();

            case "wifi":
                return wifiSSID.trim();

            default:
                return "";
        }
    }

    function reuseItem(item) {
        setType(item.type);
        setSettings(item.settings || DEFAULT_SETTINGS);
        setSelectedPreset("Custom");

        switch (item.type) {
            case "url":
                setUrl(item.value);
                break;

            case "text":
                setText(item.value);
                break;

            case "email": {
                const mail = item.value.replace(/^mailto:/, "");
                const [address, queryString] = mail.split("?");

                setEmail(address);

                if (queryString) {
                    const params = new URLSearchParams(queryString);
                    setEmailSubject(params.get("subject") || "");
                    setEmailBody(params.get("body") || "");
                } else {
                    setEmailSubject("");
                    setEmailBody("");
                }

                break;
            }

            case "phone":
                setPhone(item.value.replace(/^tel:/, ""));
                break;

            case "wifi": {
                const match = item.value.match(
                    /^WIFI:T:([^;]*);S:((?:\\.|[^;])*)?;P:((?:\\.|[^;])*)?;H:(true|false);;$/
                );

                if (match) {
                    setWifiSecurity(match[1] || "WPA");
                    setWifiSSID((match[2] || "").replace(/\\([\\;,:])/g, "$1"));
                    setWifiPassword((match[3] || "").replace(/\\([\\;,:])/g, "$1"));
                    setWifiHidden(match[4] === "true");
                } else {
                    setWifiSSID(item.displayValue || "");
                }

                break;
            }

            default:
                break;
        }

        setError("");
        setNotice("Recent QR code loaded.");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function deleteHistoryItem(id) {
        setHistory((current) => current.filter((item) => item.id !== id));
    }

    function clearHistory() {
        setHistory([]);
        setNotice("Recent QR codes cleared.");
    }

    function downloadPNG() {
        if (!qrIsValid) {
            setError(validationError || "Please enter valid information first.");
            return;
        }

        const canvas = qrCanvasRef.current;

        if (!canvas) {
            setError("QR preview is not ready yet. Please try again.");
            return;
        }

        const link = document.createElement("a");
        link.download = `gdg-qr-${type}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();

        setNotice("PNG downloaded successfully.");
        setError("");
    }

    function copyQRText() {
        if (!qrIsValid) {
            setError(validationError || "Please enter valid information first.");
            return;
        }

        navigator.clipboard
            ?.writeText(rawValue)
            .then(() => {
                setNotice("QR data copied to clipboard.");
                setError("");
            })
            .catch(() => {
                setError("Clipboard access is unavailable in this browser.");
            });
    }

    const contrastWarning = useMemo(() => {
        function hexToRgb(hex) {
            const clean = hex.replace("#", "");

            if (clean.length !== 6) return null;

            return {
                r: parseInt(clean.substring(0, 2), 16),
                g: parseInt(clean.substring(2, 4), 16),
                b: parseInt(clean.substring(4, 6), 16),
            };
        }

        function luminance(hex) {
            const rgb = hexToRgb(hex);

            if (!rgb) return 0;

            const values = [rgb.r, rgb.g, rgb.b].map((value) => {
                const channel = value / 255;

                return channel <= 0.03928
                    ? channel / 12.92
                    : Math.pow((channel + 0.055) / 1.055, 2.4);
            });

            return (
                0.2126 * values[0] +
                0.7152 * values[1] +
                0.0722 * values[2]
            );
        }

        const foreground = luminance(settings.fgColor);
        const background = luminance(settings.bgColor);

        const lighter = Math.max(foreground, background);
        const darker = Math.min(foreground, background);

        const ratio = (lighter + 0.05) / (darker + 0.05);

        if (ratio < 4.5) {
            return "Low contrast may make this QR code difficult to scan. Choose darker foreground and lighter background colors.";
        }

        if (settings.margin < 2) {
            return "A very small margin can reduce scan reliability. Consider using a margin of 2 or more.";
        }

        if (settings.size < 180) {
            return "A small QR code may be harder to scan, especially on mobile. Consider using 200px or larger.";
        }

        if (settings.level === "L") {
            return "Error correction is set to Low. For customized QR codes, Medium or High is safer.";
        }

        return "";
    }, [settings]);

    const styles = `
    * {
      box-sizing: border-box;
    }

    :root {
      font-family:
        Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
        "Segoe UI", sans-serif;
      color: #111827;
      background: #f5f7fb;
      font-synthesis: none;
      text-rendering: optimizeLegibility;
    }

    body {
      margin: 0;
      min-width: 320px;
      background:
        radial-gradient(circle at top left, rgba(99, 102, 241, 0.12), transparent 32%),
        radial-gradient(circle at top right, rgba(14, 165, 233, 0.10), transparent 28%),
        #f5f7fb;
    }

    button,
    input,
    select,
    textarea {
      font: inherit;
    }

    button {
      cursor: pointer;
    }

    .app {
      min-height: 100vh;
      padding: 28px 18px 60px;
    }

    .container {
      width: min(1180px, 100%);
      margin: 0 auto;
    }

    .hero {
      text-align: center;
      margin-bottom: 24px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 7px 12px;
      border-radius: 999px;
      background: #eef2ff;
      color: #4338ca;
      font-size: 13px;
      font-weight: 800;
      margin-bottom: 12px;
    }

    .hero h1 {
      margin: 0;
      font-size: clamp(32px, 5vw, 52px);
      letter-spacing: -1.8px;
      line-height: 1.05;
    }

    .hero p {
      max-width: 650px;
      margin: 14px auto 0;
      color: #667085;
      line-height: 1.65;
      font-size: 16px;
    }

    .workspace {
      display: grid;
      grid-template-columns: minmax(0, 1.2fr) minmax(340px, 0.8fr);
      gap: 20px;
      align-items: start;
    }

    .card {
      background: rgba(255, 255, 255, 0.94);
      border: 1px solid #e5e7eb;
      border-radius: 22px;
      box-shadow: 0 18px 55px rgba(15, 23, 42, 0.08);
      padding: 22px;
    }

    .card h2 {
      margin: 0;
      font-size: 20px;
      letter-spacing: -0.4px;
    }

    .card-subtitle {
      color: #667085;
      font-size: 14px;
      margin: 7px 0 20px;
      line-height: 1.5;
    }

    .type-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 8px;
      margin-bottom: 20px;
    }

    .type-button {
      border: 1px solid #e5e7eb;
      background: #fff;
      color: #475467;
      padding: 11px 8px;
      border-radius: 12px;
      font-size: 13px;
      font-weight: 700;
      transition: 0.18s ease;
    }

    .type-button:hover {
      border-color: #a5b4fc;
      transform: translateY(-1px);
    }

    .type-button.active {
      color: #fff;
      background: #4f46e5;
      border-color: #4f46e5;
      box-shadow: 0 8px 18px rgba(79, 70, 229, 0.25);
    }

    .field {
      margin-bottom: 15px;
    }

    .field label {
      display: block;
      margin-bottom: 7px;
      font-size: 13px;
      font-weight: 800;
      color: #344054;
    }

    .field input,
    .field textarea,
    .field select {
      width: 100%;
      border: 1px solid #d0d5dd;
      border-radius: 12px;
      padding: 11px 12px;
      outline: none;
      background: #fff;
      color: #101828;
      transition: 0.18s ease;
    }

    .field textarea {
      min-height: 110px;
      resize: vertical;
    }

    .field input:focus,
    .field textarea:focus,
    .field select:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.10);
    }

    .two-columns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .checkbox-row {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #475467;
      font-size: 14px;
      margin: 8px 0 15px;
    }

    .checkbox-row input {
      width: 16px;
      height: 16px;
    }

    .customization {
      border-top: 1px solid #eaecf0;
      padding-top: 20px;
      margin-top: 18px;
    }

    .customization-header {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      align-items: center;
      margin-bottom: 14px;
    }

    .customization-header span {
      font-size: 12px;
      color: #667085;
      font-weight: 700;
    }

    .range-row {
      display: grid;
      grid-template-columns: 1fr 70px;
      gap: 12px;
      align-items: center;
      margin-bottom: 15px;
    }

    .range-row input[type="range"] {
      width: 100%;
      accent-color: #4f46e5;
    }

    .range-value {
      border: 1px solid #e4e7ec;
      background: #f9fafb;
      border-radius: 9px;
      padding: 7px 8px;
      text-align: center;
      font-size: 13px;
      font-weight: 800;
    }

    .color-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 15px;
    }

    .color-control {
      border: 1px solid #e4e7ec;
      border-radius: 12px;
      padding: 10px;
      background: #fff;
    }

    .color-control label {
      display: flex;
      justify-content: space-between;
      margin-bottom: 7px;
      font-size: 12px;
      font-weight: 800;
      color: #475467;
    }

    .color-control input[type="color"] {
      width: 100%;
      height: 40px;
      border: 0;
      padding: 0;
      background: transparent;
      cursor: pointer;
    }

    .preset-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      margin-top: 10px;
    }

    .preset-button {
      border: 1px solid #e4e7ec;
      background: #fff;
      border-radius: 11px;
      padding: 10px 8px;
      color: #475467;
      font-size: 13px;
      font-weight: 750;
    }

    .preset-button.active {
      border-color: #818cf8;
      background: #eef2ff;
      color: #4338ca;
    }

    .error-box,
    .warning-box,
    .success-box {
      border-radius: 12px;
      padding: 12px 14px;
      margin-top: 15px;
      font-size: 13px;
      line-height: 1.5;
    }

    .error-box {
      background: #fef2f2;
      color: #b42318;
      border: 1px solid #fecaca;
    }

    .warning-box {
      background: #fffaeb;
      color: #92400e;
      border: 1px solid #fedf89;
    }

    .success-box {
      background: #ecfdf3;
      color: #027a48;
      border: 1px solid #abefc6;
    }

    .preview-card {
      position: sticky;
      top: 18px;
    }

    .preview-area {
      min-height: 370px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 22px;
      border-radius: 18px;
      background:
        linear-gradient(45deg, #f8fafc 25%, transparent 25%),
        linear-gradient(-45deg, #f8fafc 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #f8fafc 75%),
        linear-gradient(-45deg, transparent 75%, #f8fafc 75%);
      background-size: 24px 24px;
      background-position: 0 0, 0 12px, 12px -12px, -12px 0;
      border: 1px solid #eaecf0;
      overflow: auto;
    }

    .qr-shell {
      padding: 12px;
      background: #fff;
      border-radius: 14px;
      box-shadow: 0 18px 45px rgba(15, 23, 42, 0.12);
      display: flex;
      align-items: center;
      justify-content: center;
      max-width: 100%;
    }

    .empty-preview {
      text-align: center;
      color: #667085;
      max-width: 260px;
      line-height: 1.6;
      font-size: 14px;
    }

    .preview-actions {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-top: 14px;
    }

    .primary-button,
    .secondary-button {
      border: 0;
      border-radius: 12px;
      padding: 12px 14px;
      font-weight: 800;
      font-size: 14px;
      transition: 0.18s ease;
    }

    .primary-button {
      background: #4f46e5;
      color: #fff;
      box-shadow: 0 8px 18px rgba(79, 70, 229, 0.22);
    }

    .primary-button:hover {
      background: #4338ca;
      transform: translateY(-1px);
    }

    .secondary-button {
      background: #f2f4f7;
      color: #344054;
    }

    .secondary-button:hover {
      background: #e4e7ec;
    }

    .primary-button:disabled {
      opacity: 0.45;
      cursor: not-allowed;
      transform: none;
    }

    .preview-meta {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-top: 14px;
      color: #667085;
      font-size: 12px;
      font-weight: 700;
    }

    .history {
      margin-top: 20px;
    }

    .history-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;
    }

    .history-header h2 {
      margin: 0;
    }

    .clear-button {
      border: 0;
      background: transparent;
      color: #b42318;
      font-size: 12px;
      font-weight: 800;
      padding: 6px;
    }

    .history-list {
      display: grid;
      gap: 9px;
      max-height: 420px;
      overflow-y: auto;
    }

    .history-item {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 10px;
      align-items: center;
      border: 1px solid #eaecf0;
      border-radius: 12px;
      padding: 11px;
      background: #fff;
    }

    .history-info {
      min-width: 0;
    }

    .history-type {
      color: #4338ca;
      font-size: 11px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .history-value {
      margin-top: 4px;
      color: #344054;
      font-size: 13px;
      font-weight: 700;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .history-date {
      margin-top: 3px;
      color: #98a2b3;
      font-size: 11px;
    }

    .history-actions {
      display: flex;
      gap: 5px;
    }

    .small-button {
      border: 1px solid #e4e7ec;
      background: #fff;
      color: #475467;
      border-radius: 9px;
      padding: 7px 9px;
      font-size: 11px;
      font-weight: 800;
    }

    .small-button:hover {
      background: #f9fafb;
    }

    .footer-note {
      text-align: center;
      color: #98a2b3;
      font-size: 12px;
      margin-top: 22px;
    }

    @media (max-width: 900px) {
      .workspace {
        grid-template-columns: 1fr;
      }

      .preview-card {
        position: static;
      }

      .type-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    @media (max-width: 560px) {
      .app {
        padding: 18px 10px 40px;
      }

      .card {
        padding: 16px;
        border-radius: 17px;
      }

      .type-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .two-columns,
      .color-row {
        grid-template-columns: 1fr;
      }

      .preset-grid {
        grid-template-columns: 1fr;
      }

      .preview-actions {
        grid-template-columns: 1fr;
      }

      .preview-area {
        min-height: 300px;
        padding: 12px;
      }

      .hero h1 {
        font-size: 34px;
      }

      .history-item {
        grid-template-columns: 1fr;
      }

      .history-actions {
        width: 100%;
      }

      .history-actions .small-button {
        flex: 1;
      }
    }
  `;

    return (
        <>
            <style>{styles}</style>

            <main className="app">
                <div className="container">
                    <header className="hero">
                        <div className="badge">⚡ GDG on Campus SRM · QR Designer</div>

                        <h1>QR Code Generator</h1>

                        <p>
                            Create, customize, preview, save and download reliable QR codes
                            directly in your browser.
                        </p>
                    </header>

                    <section className="workspace">
                        <div>
                            <div className="card">
                                <h2>QR Information</h2>

                                <p className="card-subtitle">
                                    Choose a QR type and enter the information. The preview
                                    updates automatically.
                                </p>

                                <div className="type-grid">
                                    {Object.entries(TYPE_LABELS).map(([key, label]) => (
                                        <button
                                            key={key}
                                            className={`type-button ${
                                                type === key ? "active" : ""
                                            }`}
                                            onClick={() => handleTypeChange(key)}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>

                                {type === "url" && (
                                    <div className="field">
                                        <label htmlFor="url">Website URL</label>

                                        <input
                                            id="url"
                                            type="url"
                                            placeholder="https://example.com"
                                            value={url}
                                            onChange={(event) => {
                                                setUrl(event.target.value);
                                                setError("");
                                                setNotice("");
                                            }}
                                        />
                                    </div>
                                )}

                                {type === "text" && (
                                    <div className="field">
                                        <label htmlFor="text">Plain Text</label>

                                        <textarea
                                            id="text"
                                            placeholder="Enter any text you want to encode..."
                                            value={text}
                                            onChange={(event) => {
                                                setText(event.target.value);
                                                setError("");
                                                setNotice("");
                                            }}
                                        />
                                    </div>
                                )}

                                {type === "email" && (
                                    <>
                                        <div className="field">
                                            <label htmlFor="email">Email Address</label>

                                            <input
                                                id="email"
                                                type="email"
                                                placeholder="hello@example.com"
                                                value={email}
                                                onChange={(event) => {
                                                    setEmail(event.target.value);
                                                    setError("");
                                                    setNotice("");
                                                }}
                                            />
                                        </div>

                                        <div className="two-columns">
                                            <div className="field">
                                                <label htmlFor="subject">Subject</label>

                                                <input
                                                    id="subject"
                                                    placeholder="Email subject"
                                                    value={emailSubject}
                                                    onChange={(event) => {
                                                        setEmailSubject(event.target.value);
                                                        setError("");
                                                        setNotice("");
                                                    }}
                                                />
                                            </div>

                                            <div className="field">
                                                <label htmlFor="body">Message</label>

                                                <input
                                                    id="body"
                                                    placeholder="Email message"
                                                    value={emailBody}
                                                    onChange={(event) => {
                                                        setEmailBody(event.target.value);
                                                        setError("");
                                                        setNotice("");
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {type === "phone" && (
                                    <div className="field">
                                        <label htmlFor="phone">Phone Number</label>

                                        <input
                                            id="phone"
                                            type="tel"
                                            placeholder="+91 98765 43210"
                                            value={phone}
                                            onChange={(event) => {
                                                setPhone(event.target.value);
                                                setError("");
                                                setNotice("");
                                            }}
                                        />
                                    </div>
                                )}

                                {type === "wifi" && (
                                    <>
                                        <div className="field">
                                            <label htmlFor="ssid">Wi-Fi Network Name</label>

                                            <input
                                                id="ssid"
                                                placeholder="My Wi-Fi"
                                                value={wifiSSID}
                                                onChange={(event) => {
                                                    setWifiSSID(event.target.value);
                                                    setError("");
                                                    setNotice("");
                                                }}
                                            />
                                        </div>

                                        <div className="two-columns">
                                            <div className="field">
                                                <label htmlFor="security">Security</label>

                                                <select
                                                    id="security"
                                                    value={wifiSecurity}
                                                    onChange={(event) => {
                                                        setWifiSecurity(event.target.value);
                                                        setError("");
                                                        setNotice("");
                                                    }}
                                                >
                                                    <option value="WPA">WPA/WPA2/WPA3</option>
                                                    <option value="WEP">WEP</option>
                                                    <option value="nopass">No Password</option>
                                                </select>
                                            </div>

                                            <div className="field">
                                                <label htmlFor="wifiPassword">Password</label>

                                                <input
                                                    id="wifiPassword"
                                                    type="password"
                                                    placeholder={
                                                        wifiSecurity === "nopass"
                                                            ? "No password"
                                                            : "Wi-Fi password"
                                                    }
                                                    value={wifiPassword}
                                                    disabled={wifiSecurity === "nopass"}
                                                    onChange={(event) => {
                                                        setWifiPassword(event.target.value);
                                                        setError("");
                                                        setNotice("");
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <label className="checkbox-row">
                                            <input
                                                type="checkbox"
                                                checked={wifiHidden}
                                                onChange={(event) =>
                                                    setWifiHidden(event.target.checked)
                                                }
                                            />

                                            Hidden Wi-Fi network
                                        </label>
                                    </>
                                )}

                                <div className="customization">
                                    <div className="customization-header">
                                        <h2>Customize</h2>

                                        <span>
                      {selectedPreset === "Custom"
                          ? "Custom settings"
                          : `${selectedPreset} preset`}
                    </span>
                                    </div>

                                    <div className="field">
                                        <label>Presets</label>

                                        <div className="preset-grid">
                                            {Object.keys(PRESETS).map((name) => (
                                                <button
                                                    key={name}
                                                    className={`preset-button ${
                                                        selectedPreset === name ? "active" : ""
                                                    }`}
                                                    onClick={() => applyPreset(name)}
                                                >
                                                    {name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="field">
                                        <label>QR Size</label>

                                        <div className="range-row">
                                            <input
                                                type="range"
                                                min="160"
                                                max="500"
                                                step="10"
                                                value={settings.size}
                                                onChange={(event) =>
                                                    updateSetting(
                                                        "size",
                                                        Number(event.target.value)
                                                    )
                                                }
                                            />

                                            <div className="range-value">
                                                {settings.size}px
                                            </div>
                                        </div>
                                    </div>

                                    <div className="color-row">
                                        <div className="color-control">
                                            <label>
                                                <span>Foreground</span>
                                                <span>{settings.fgColor}</span>
                                            </label>

                                            <input
                                                type="color"
                                                value={settings.fgColor}
                                                onChange={(event) =>
                                                    updateSetting("fgColor", event.target.value)
                                                }
                                            />
                                        </div>

                                        <div className="color-control">
                                            <label>
                                                <span>Background</span>
                                                <span>{settings.bgColor}</span>
                                            </label>

                                            <input
                                                type="color"
                                                value={settings.bgColor}
                                                onChange={(event) =>
                                                    updateSetting("bgColor", event.target.value)
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="two-columns">
                                        <div className="field">
                                            <label>Error Correction</label>

                                            <select
                                                value={settings.level}
                                                onChange={(event) =>
                                                    updateSetting("level", event.target.value)
                                                }
                                            >
                                                <option value="L">Low — 7%</option>
                                                <option value="M">Medium — 15%</option>
                                                <option value="Q">Quartile — 25%</option>
                                                <option value="H">High — 30%</option>
                                            </select>
                                        </div>

                                        <div className="field">
                                            <label>Margin / Padding</label>

                                            <div className="range-row">
                                                <input
                                                    type="range"
                                                    min="0"
                                                    max="12"
                                                    step="1"
                                                    value={settings.margin}
                                                    onChange={(event) =>
                                                        updateSetting(
                                                            "margin",
                                                            Number(event.target.value)
                                                        )
                                                    }
                                                />

                                                <div className="range-value">
                                                    {settings.margin}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {contrastWarning && (
                                        <div className="warning-box">
                                            ⚠️ <strong>Scan reliability warning:</strong>{" "}
                                            {contrastWarning}
                                        </div>
                                    )}

                                    {error && <div className="error-box">❌ {error}</div>}

                                    {notice && !error && (
                                        <div className="success-box">✓ {notice}</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <aside>
                            <div className="card preview-card">
                                <h2>Live Preview</h2>

                                <p className="card-subtitle">
                                    Your QR code updates immediately as you type or customize
                                    it.
                                </p>

                                <div className="preview-area">
                                    {qrIsValid ? (
                                        <div className="qr-shell">
                                            <QRCodeCanvas
                                                ref={qrCanvasRef}
                                                value={rawValue}
                                                size={settings.size}
                                                bgColor={settings.bgColor}
                                                fgColor={settings.fgColor}
                                                level={settings.level}
                                                includeMargin={settings.margin > 0}
                                            />
                                        </div>
                                    ) : (
                                        <div className="empty-preview">
                                            <div style={{ fontSize: 48, marginBottom: 10 }}>
                                                ▦
                                            </div>

                                            <strong>Your QR preview will appear here</strong>

                                            <div style={{ marginTop: 8 }}>
                                                Enter valid information to generate a scannable QR
                                                code.
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="preview-meta">
                  <span>
                    Type: {TYPE_LABELS[type]}
                  </span>

                                    <span>
                    {settings.size} × {settings.size}px
                  </span>
                                </div>

                                <div className="preview-actions">
                                    <button
                                        className="primary-button"
                                        disabled={!qrIsValid}
                                        onClick={downloadPNG}
                                    >
                                        ↓ Download PNG
                                    </button>

                                    <button
                                        className="secondary-button"
                                        disabled={!qrIsValid}
                                        onClick={saveToHistory}
                                    >
                                        ☆ Save to Recent
                                    </button>
                                </div>

                                <button
                                    className="secondary-button"
                                    style={{
                                        width: "100%",
                                        marginTop: 10,
                                    }}
                                    disabled={!qrIsValid}
                                    onClick={copyQRText}
                                >
                                    ⧉ Copy QR Data
                                </button>

                                <div className="history">
                                    <div className="history-header">
                                        <h2>Recent QR Codes</h2>

                                        {history.length > 0 && (
                                            <button
                                                className="clear-button"
                                                onClick={clearHistory}
                                            >
                                                Clear all
                                            </button>
                                        )}
                                    </div>

                                    {history.length === 0 ? (
                                        <div
                                            style={{
                                                color: "#98a2b3",
                                                fontSize: 13,
                                                lineHeight: 1.5,
                                            }}
                                        >
                                            Saved QR codes will appear here and remain available
                                            after refreshing the page.
                                        </div>
                                    ) : (
                                        <div className="history-list">
                                            {history.map((item) => (
                                                <div className="history-item" key={item.id}>
                                                    <div className="history-info">
                                                        <div className="history-type">
                                                            {item.label}
                                                        </div>

                                                        <div className="history-value">
                                                            {item.displayValue || item.value}
                                                        </div>

                                                        <div className="history-date">
                                                            {item.createdAt}
                                                        </div>
                                                    </div>

                                                    <div className="history-actions">
                                                        <button
                                                            className="small-button"
                                                            onClick={() => reuseItem(item)}
                                                        >
                                                            Reuse
                                                        </button>

                                                        <button
                                                            className="small-button"
                                                            onClick={() => deleteHistoryItem(item.id)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </aside>
                    </section>

                    <div className="footer-note">
                        Built for the GDG on Campus SRM Technical Recruitment 2026–27
                        task · Browser-only · No backend required
                    </div>
                </div>
            </main>
        </>
    );
}

export default App;