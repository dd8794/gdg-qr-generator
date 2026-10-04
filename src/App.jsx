import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";

function App() {
    const [type, setType] = useState("url");

    const [text, setText] = useState("");
    const [phone, setPhone] = useState("");

    const [wifiName, setWifiName] = useState("");
    const [wifiPassword, setWifiPassword] = useState("");
    const [wifiSecurity, setWifiSecurity] = useState("WPA");

    const [qrText, setQrText] = useState("");
    const [error, setError] = useState("");

    const [size, setSize] = useState(220);
    const [foreground, setForeground] = useState("#000000");
    const [background, setBackground] = useState("#ffffff");
    const [margin, setMargin] = useState(2);
    const [errorLevel, setErrorLevel] = useState("M");

    const [history, setHistory] = useState(() => {
        const savedHistory = localStorage.getItem("qrHistory");

        return savedHistory ? JSON.parse(savedHistory) : [];
    });

    function changeType(newType) {
        setType(newType);

        setText("");
        setPhone("");
        setWifiName("");
        setWifiPassword("");

        setQrText("");
        setError("");
    }

    function generateQR() {
        setError("");

        let value = "";

        // URL
        if (type === "url") {
            if (text.trim() === "") {
                setQrText("");
                setError("Please enter a URL.");
                return;
            }

            try {
                const url = new URL(text);

                if (
                    url.protocol !== "http:" &&
                    url.protocol !== "https:"
                ) {
                    setQrText("");
                    setError("Please enter a valid URL.");
                    return;
                }
            } catch {
                setQrText("");
                setError(
                    "Please enter a valid URL, like https://google.com"
                );
                return;
            }

            value = text;
        }

        // Plain Text
        if (type === "text") {
            if (text.trim() === "") {
                setQrText("");
                setError("Please enter some text.");
                return;
            }

            value = text;
        }

        // Email
        if (type === "email") {
            if (text.trim() === "") {
                setQrText("");
                setError("Please enter an email address.");
                return;
            }

            if (!text.includes("@") || !text.includes(".")) {
                setQrText("");
                setError("Please enter a valid email address.");
                return;
            }

            value = `mailto:${text}`;
        }

        // Phone
        if (type === "phone") {
            if (phone.trim() === "") {
                setQrText("");
                setError("Please enter a phone number.");
                return;
            }

            const cleanedPhone = phone.replace(/[\s()-]/g, "");

            if (!/^\+?[0-9]{7,15}$/.test(cleanedPhone)) {
                setQrText("");
                setError("Please enter a valid phone number.");
                return;
            }

            value = `tel:${cleanedPhone}`;
        }

        // Wi-Fi
        if (type === "wifi") {
            if (wifiName.trim() === "") {
                setQrText("");
                setError("Please enter the Wi-Fi network name.");
                return;
            }

            if (
                wifiSecurity !== "nopass" &&
                wifiPassword.trim() === ""
            ) {
                setQrText("");
                setError("Please enter the Wi-Fi password.");
                return;
            }

            value =
                `WIFI:T:${wifiSecurity};` +
                `S:${wifiName};` +
                `P:${wifiPassword};;`;
        }

        setQrText(value);

        const displayValue =
            type === "phone"
                ? phone
                : type === "wifi"
                    ? wifiName
                    : text;

        const newItem = {
            id: Date.now(),
            type: type,
            value: displayValue,
            createdAt: new Date().toLocaleString(),
        };

        const updatedHistory = [newItem, ...history].slice(0, 10);

        setHistory(updatedHistory);

        localStorage.setItem(
            "qrHistory",
            JSON.stringify(updatedHistory)
        );
    }

    function downloadQR() {
        const canvas = document.querySelector("canvas");

        if (!canvas) {
            alert("Please generate a QR code first!");
            return;
        }

        const image = canvas.toDataURL("image/png");

        const link = document.createElement("a");

        link.href = image;
        link.download = "my-qr-code.png";

        link.click();
    }

    function clearHistory() {
        setHistory([]);
        localStorage.removeItem("qrHistory");
    }

    function applyPreset(preset) {
        if (preset === "classic") {
            setForeground("#000000");
            setBackground("#ffffff");
        }

        if (preset === "dark") {
            setForeground("#ffffff");
            setBackground("#111111");
        }

        if (preset === "contrast") {
            setForeground("#000000");
            setBackground("#ffff00");
        }
    }

    function getTypeIcon(itemType) {
        if (itemType === "url") return "🔗";
        if (itemType === "email") return "📧";
        if (itemType === "phone") return "📱";
        if (itemType === "wifi") return "📶";

        return "📝";
    }

    function getTypeName(itemType) {
        if (itemType === "url") return "URL";
        if (itemType === "email") return "Email";
        if (itemType === "phone") return "Phone";
        if (itemType === "wifi") return "Wi-Fi";

        return "Text";
    }

    return (
        <>
            <style>{`
        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: Arial, sans-serif;
          background: #f4f7fb;
          color: #111827;
        }

        button,
        input,
        select {
          font: inherit;
        }

        button {
          cursor: pointer;
        }

        .app {
          min-height: 100vh;
          padding: 40px 20px;
        }

        .container {
          width: 100%;
          max-width: 700px;
          margin: 0 auto;
        }

        .header {
          text-align: center;
          margin-bottom: 30px;
        }

        .logo {
          width: 60px;
          height: 60px;
          margin: 0 auto 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 16px;
          background: #111827;
          color: white;
          font-size: 20px;
          font-weight: 800;
        }

        .header h1 {
          margin: 0;
          font-size: 36px;
        }

        .header p {
          margin-top: 10px;
          color: #6b7280;
          font-size: 16px;
        }

        .card,
        .result-card,
        .history-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 20px;
          padding: 28px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label,
        .color-grid label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .form-group input,
        .form-group select,
        .wifi-box input,
        .wifi-box select {
          width: 100%;
          padding: 13px 14px;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          background: white;
          color: #111827;
          outline: none;
        }

        .form-group input:focus,
        .form-group select:focus,
        .wifi-box input:focus,
        .wifi-box select:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
        }

        .wifi-box {
          padding: 20px;
          margin-bottom: 20px;
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
        }

        .wifi-box h3 {
          margin-top: 0;
          margin-bottom: 20px;
        }

        .error-message {
          padding: 12px 14px;
          margin-bottom: 20px;
          border-radius: 10px;
          background: #fee2e2;
          color: #b91c1c;
          font-size: 14px;
        }

        .settings-section {
          padding: 20px;
          margin-top: 20px;
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 14px;
        }

        .settings-section h3 {
          margin-top: 0;
          margin-bottom: 18px;
        }

        .preset-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .secondary-button {
          padding: 10px 15px;
          border: 1px solid #d1d5db;
          border-radius: 9px;
          background: white;
          color: #374151;
          font-weight: 600;
        }

        .secondary-button:hover {
          background: #111827;
          color: white;
        }

        .setting-row {
          margin-bottom: 22px;
        }

        .setting-label {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          color: #374151;
        }

        .setting-row input[type="range"] {
          width: 100%;
          accent-color: #2563eb;
        }

        .color-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 22px;
        }

        .color-grid input[type="color"] {
          width: 100%;
          height: 45px;
          padding: 4px;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          background: white;
          cursor: pointer;
        }

        .generate-button {
          width: 100%;
          margin-top: 22px;
          padding: 15px;
          border: none;
          border-radius: 11px;
          background: #111827;
          color: white;
          font-size: 16px;
          font-weight: 700;
        }

        .generate-button:hover {
          background: #2563eb;
        }

        .result-card {
          margin-top: 20px;
          text-align: center;
        }

        .result-card h2 {
          margin-top: 0;
        }

        .qr-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 25px;
          margin: 20px auto;
          background: #f8fafc;
          border-radius: 15px;
          overflow: auto;
        }

        .download-button {
          width: 100%;
          padding: 13px;
          border: none;
          border-radius: 10px;
          background: #2563eb;
          color: white;
          font-weight: 700;
        }

        .download-button:hover {
          background: #1d4ed8;
        }

        .history-card {
          margin-top: 20px;
        }

        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          margin-bottom: 20px;
        }

        .history-header h2 {
          margin: 0;
        }

        .history-header p {
          margin: 5px 0 0;
          color: #6b7280;
          font-size: 14px;
        }

        .clear-button {
          padding: 8px 13px;
          border: 1px solid #fecaca;
          border-radius: 8px;
          background: #fff1f2;
          color: #be123c;
          font-size: 13px;
          font-weight: 600;
        }

        .clear-button:hover {
          background: #be123c;
          color: white;
        }

        .history-item {
          display: flex;
          gap: 14px;
          padding: 15px;
          margin-bottom: 10px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          background: #fafafa;
        }

        .history-icon {
          width: 42px;
          height: 42px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          background: #eef2ff;
          font-size: 20px;
        }

        .history-content {
          min-width: 0;
        }

        .history-content p {
          margin: 5px 0;
          word-break: break-word;
          color: #374151;
        }

        .history-content small {
          color: #9ca3af;
        }

        footer {
          text-align: center;
          padding: 25px 0;
          color: #9ca3af;
          font-size: 13px;
        }

        @media (max-width: 600px) {
          .app {
            padding: 20px 12px;
          }

          .header h1 {
            font-size: 28px;
          }

          .card,
          .result-card,
          .history-card {
            padding: 20px;
            border-radius: 16px;
          }

          .color-grid {
            grid-template-columns: 1fr;
          }

          .preset-buttons {
            flex-direction: column;
          }

          .secondary-button {
            width: 100%;
          }

          .history-header {
            align-items: flex-start;
          }

          .qr-wrapper {
            padding: 15px;
          }
        }
      `}</style>

            <div className="app">
                <main className="container">

                    <header className="header">
                        <div className="logo">QR</div>

                        <h1>QR Code Generator 🚀</h1>

                        <p>
                            Create, customize and download QR codes in seconds.
                        </p>
                    </header>

                    <section className="card">

                        <div className="form-group">
                            <label htmlFor="qr-type">
                                QR Code Type
                            </label>

                            <select
                                id="qr-type"
                                value={type}
                                onChange={(e) =>
                                    changeType(e.target.value)
                                }
                            >
                                <option value="url">🔗 URL</option>
                                <option value="text">📝 Plain Text</option>
                                <option value="email">📧 Email</option>
                                <option value="phone">📱 Phone</option>
                                <option value="wifi">📶 Wi-Fi</option>
                            </select>
                        </div>

                        {(type === "url" ||
                            type === "text" ||
                            type === "email") && (
                            <div className="form-group">
                                <label htmlFor="main-input">
                                    {type === "url"
                                        ? "Website URL"
                                        : type === "email"
                                            ? "Email Address"
                                            : "Your Text"}
                                </label>

                                <input
                                    id="main-input"
                                    type={
                                        type === "email"
                                            ? "email"
                                            : "text"
                                    }
                                    value={text}
                                    onChange={(e) =>
                                        setText(e.target.value)
                                    }
                                    placeholder={
                                        type === "url"
                                            ? "https://example.com"
                                            : type === "email"
                                                ? "example@email.com"
                                                : "Enter your text"
                                    }
                                />
                            </div>
                        )}

                        {type === "phone" && (
                            <div className="form-group">
                                <label htmlFor="phone">
                                    Phone Number
                                </label>

                                <input
                                    id="phone"
                                    type="tel"
                                    value={phone}
                                    onChange={(e) =>
                                        setPhone(e.target.value)
                                    }
                                    placeholder="+91 9876543210"
                                />
                            </div>
                        )}

                        {type === "wifi" && (
                            <div className="wifi-box">

                                <h3>Wi-Fi Details 📶</h3>

                                <div className="form-group">
                                    <label htmlFor="wifi-name">
                                        Network Name
                                    </label>

                                    <input
                                        id="wifi-name"
                                        type="text"
                                        value={wifiName}
                                        onChange={(e) =>
                                            setWifiName(e.target.value)
                                        }
                                        placeholder="My Wi-Fi"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="wifi-security">
                                        Security
                                    </label>

                                    <select
                                        id="wifi-security"
                                        value={wifiSecurity}
                                        onChange={(e) =>
                                            setWifiSecurity(e.target.value)
                                        }
                                    >
                                        <option value="WPA">
                                            WPA / WPA2
                                        </option>

                                        <option value="WEP">
                                            WEP
                                        </option>

                                        <option value="nopass">
                                            No Password
                                        </option>
                                    </select>
                                </div>

                                {wifiSecurity !== "nopass" && (
                                    <div className="form-group">
                                        <label htmlFor="wifi-password">
                                            Password
                                        </label>

                                        <input
                                            id="wifi-password"
                                            type="password"
                                            value={wifiPassword}
                                            onChange={(e) =>
                                                setWifiPassword(e.target.value)
                                            }
                                            placeholder="Wi-Fi password"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {error && (
                            <div className="error-message">
                                ⚠️ {error}
                            </div>
                        )}

                        <div className="settings-section">
                            <h3>Quick Presets</h3>

                            <div className="preset-buttons">

                                <button
                                    className="secondary-button"
                                    onClick={() =>
                                        applyPreset("classic")
                                    }
                                >
                                    Classic
                                </button>

                                <button
                                    className="secondary-button"
                                    onClick={() =>
                                        applyPreset("dark")
                                    }
                                >
                                    Dark
                                </button>

                                <button
                                    className="secondary-button"
                                    onClick={() =>
                                        applyPreset("contrast")
                                    }
                                >
                                    High Contrast
                                </button>

                            </div>
                        </div>

                        <div className="settings-section">

                            <h3>Customize QR Code</h3>

                            <div className="setting-row">

                                <div className="setting-label">
                                    <span>Size</span>
                                    <strong>{size}px</strong>
                                </div>

                                <input
                                    type="range"
                                    min="120"
                                    max="400"
                                    value={size}
                                    onChange={(e) =>
                                        setSize(Number(e.target.value))
                                    }
                                />

                            </div>

                            <div className="color-grid">

                                <div>
                                    <label htmlFor="foreground">
                                        Foreground
                                    </label>

                                    <input
                                        id="foreground"
                                        type="color"
                                        value={foreground}
                                        onChange={(e) =>
                                            setForeground(e.target.value)
                                        }
                                    />
                                </div>

                                <div>
                                    <label htmlFor="background">
                                        Background
                                    </label>

                                    <input
                                        id="background"
                                        type="color"
                                        value={background}
                                        onChange={(e) =>
                                            setBackground(e.target.value)
                                        }
                                    />
                                </div>

                            </div>

                            <div className="setting-row">

                                <div className="setting-label">
                                    <span>Margin</span>
                                    <strong>{margin}</strong>
                                </div>

                                <input
                                    type="range"
                                    min="0"
                                    max="10"
                                    value={margin}
                                    onChange={(e) =>
                                        setMargin(Number(e.target.value))
                                    }
                                />

                            </div>

                            <div className="form-group">

                                <label htmlFor="error-level">
                                    Error Correction
                                </label>

                                <select
                                    id="error-level"
                                    value={errorLevel}
                                    onChange={(e) =>
                                        setErrorLevel(e.target.value)
                                    }
                                >
                                    <option value="L">
                                        Low (L)
                                    </option>

                                    <option value="M">
                                        Medium (M)
                                    </option>

                                    <option value="Q">
                                        Quartile (Q)
                                    </option>

                                    <option value="H">
                                        High (H)
                                    </option>
                                </select>

                            </div>

                        </div>

                        <button
                            className="generate-button"
                            onClick={generateQR}
                        >
                            Generate QR Code
                        </button>

                    </section>

                    {qrText && (
                        <section className="result-card">

                            <h2>Your QR Code</h2>

                            <div className="qr-wrapper">

                                <QRCodeCanvas
                                    value={qrText}
                                    size={size}
                                    fgColor={foreground}
                                    bgColor={background}
                                    level={errorLevel}
                                    marginSize={margin}
                                />

                            </div>

                            <button
                                className="download-button"
                                onClick={downloadQR}
                            >
                                Download PNG 📥
                            </button>

                        </section>
                    )}

                    {history.length > 0 && (
                        <section className="history-card">

                            <div className="history-header">

                                <div>
                                    <h2>Recent QR Codes 🕘</h2>

                                    <p>
                                        Your latest generated QR codes
                                    </p>
                                </div>

                                <button
                                    className="clear-button"
                                    onClick={clearHistory}
                                >
                                    Clear
                                </button>

                            </div>

                            <div>
                                {history.map((item) => (
                                    <div
                                        className="history-item"
                                        key={item.id}
                                    >

                                        <div className="history-icon">
                                            {getTypeIcon(item.type)}
                                        </div>

                                        <div className="history-content">

                                            <strong>
                                                {getTypeName(item.type)}
                                            </strong>

                                            <p>
                                                {item.value}
                                            </p>

                                            <small>
                                                {item.createdAt}
                                            </small>

                                        </div>

                                    </div>
                                ))}
                            </div>

                        </section>
                    )}

                    <footer>
                        Built with React ⚛️
                    </footer>

                </main>
            </div>
        </>
    );
}
export default App;