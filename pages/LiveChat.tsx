import React from 'react';

const LiveChat: React.FC = () => {
  // We use a sandboxed iframe to isolate the chat script. 
  // We also inject specific CSS to force the widget to be full-screen inside this iframe
  // effectively turning a "floating" widget into an "embedded" page component.
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <title>Live Chat</title>
      <style>
        body { 
          background-color: #0f172a; 
          margin: 0; 
          padding: 0; 
          height: 100vh; 
          width: 100vw;
          overflow: hidden;
          font-family: sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Loading State Styling */
        .loading-container {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          position: absolute;
          z-index: 0; /* Behind the widget */
        }
        .icon-ring {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: rgba(251, 191, 36, 0.1);
          border: 1px solid rgba(251, 191, 36, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
          box-shadow: 0 0 15px rgba(251, 191, 36, 0.1);
        }
        svg {
          color: #fbbf24;
          width: 30px;
          height: 30px;
        }
        .loader {
          width: 18px;
          height: 18px;
          border: 2px solid #334155;
          border-bottom-color: #fbbf24;
          border-radius: 50%;
          display: inline-block;
          box-sizing: border-box;
          animation: rotation 1s linear infinite;
        }
        @keyframes rotation {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* 
           AGGRESSIVE OVERRIDES 
           Force the SalesSmartly widget (usually an iframe or div) to take up 100% of the view.
        */
        iframe, #ss-widget, .ss-widget-container, [id^="salesmartly"] {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            max-height: 100vh !important;
            margin: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            z-index: 9999 !important;
            bottom: 0 !important;
            right: 0 !important;
            background: transparent !important;
        }
        
        /* Attempt to minimize the initial launcher button so it doesn't look like a giant icon before auto-click */
        .ss-launcher-button, [id*="launcher"] {
           width: 1px !important;
           height: 1px !important;
           opacity: 0.1 !important;
           pointer-events: none !important;
        }
      </style>
    </head>
    <body>
      <div class="loading-container">
        <div class="icon-ring">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>
        </div>
        <p style="margin:0; font-weight: 500; color: #94a3b8;">Connecting to Support...</p>
        <span class="loader"></span>
      </div>
      
      <!-- SalesSmartly Script Updated -->
      <script src="https://plugin-code.salesmartly.com/js/project_551896_577608_1764885905.js"></script>
      
      <script>
        // Attempt to maximize usage of the widget once it loads
        var checkCount = 0;
        
        function tryOpenChat() {
            // Find launcher buttons
            var launcher = document.querySelector('[id*="launcher"], .ss-launcher-button, [class*="launcher"]');
            
            // If found, click it to open the main iframe
            if(launcher) {
               console.log("Launcher found, attempting to open...");
               launcher.click();
            } else if (checkCount < 20) {
               // Retry for up to 10 seconds
               checkCount++;
               setTimeout(tryOpenChat, 500);
            }
        }

        window.onload = function() {
           // Start trying to open the chat automatically
           setTimeout(tryOpenChat, 1000);
        };
      </script>
    </body>
    </html>
  `;

  return (
    <div className="w-full h-[calc(100vh-128px)] bg-[#0f172a] animate-fade-in relative z-0">
      <iframe
        srcDoc={htmlContent}
        title="Live Chat"
        className="w-full h-full border-0"
        // Sandbox permissions as requested: 允许脚本 (allow-scripts), 允许同源 (allow-same-origin), 
        // 允许表单 (allow-forms), 允许弹出窗口 (allow-popups), 允许模态框 (allow-modals)
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-popups-to-escape-sandbox"
      />
    </div>
  );
};

export default LiveChat;