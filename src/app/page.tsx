'use client';

import { useState } from 'react';

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsLoading(true);
      
      // Send POST request to /api/poster
      const response = await fetch('/api/poster', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: 'Poster Generated' }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate poster');
      }

      const data = await response.json();
      const { imageBase64 } = data;

      // Convert base64 to blob
      const byteCharacters = atob(imageBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });
      
      // Create download URL
      const url = URL.createObjectURL(blob);
      const fileName = `poster-${Date.now()}.png`;

      // Check if mobile Safari (iOS)
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream: unknown }).MSStream;
      
      if (isIOS) {
        // iOS Safari - multiple download options
        const reader = new FileReader();
        reader.onloadend = function() {
          const dataUrl = reader.result as string;
          
          // Option 1: Try using Web Share API (iOS 15+)
          if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], fileName, { type: 'image/png' })] })) {
            navigator.share({
              files: [new File([blob], fileName, { type: 'image/png' })],
              title: 'Poster',
              text: '생성된 포스터 이미지'
            }).catch((error) => {
              console.log('Share failed, falling back to display method:', error);
              // Fallback to display method
              displayImageForiOS(dataUrl, fileName);
            });
          } else {
            // Option 2: Display in new tab with multiple save options
            displayImageForiOS(dataUrl, fileName);
          }
        };
        reader.readAsDataURL(blob);
        
        function displayImageForiOS(dataUrl: string, fileName: string) {
          const newTab = window.open();
          if (newTab) {
            newTab.document.write(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>${fileName}</title>
                  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                  <meta name="apple-mobile-web-app-capable" content="yes">
                  <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { 
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                      min-height: 100vh;
                      display: flex;
                      flex-direction: column;
                      align-items: center;
                      padding: 20px;
                    }
                    .container {
                      background: white;
                      border-radius: 20px;
                      padding: 20px;
                      box-shadow: 0 20px 40px rgba(0,0,0,0.2);
                      max-width: 100%;
                      width: 100%;
                      max-width: 500px;
                    }
                    img { 
                      width: 100%;
                      height: auto; 
                      border-radius: 12px;
                      display: block;
                      margin-bottom: 20px;
                    }
                    .instructions {
                      background: #f8f9fa;
                      border-radius: 12px;
                      padding: 16px;
                      margin-bottom: 20px;
                    }
                    h2 {
                      color: #333;
                      font-size: 20px;
                      margin-bottom: 12px;
                      text-align: center;
                    }
                    .method {
                      margin: 12px 0;
                      padding: 12px;
                      background: white;
                      border-radius: 8px;
                      border-left: 4px solid #667eea;
                    }
                    .method-title {
                      font-weight: 600;
                      color: #667eea;
                      margin-bottom: 4px;
                    }
                    .method-desc {
                      color: #666;
                      font-size: 14px;
                      line-height: 1.4;
                    }
                    .download-link {
                      display: block;
                      width: 100%;
                      padding: 16px;
                      background: #667eea;
                      color: white;
                      text-align: center;
                      text-decoration: none;
                      border-radius: 12px;
                      font-weight: 600;
                      font-size: 16px;
                      margin-top: 20px;
                      transition: background 0.3s;
                    }
                    .download-link:active {
                      background: #5a67d8;
                    }
                    .copy-btn {
                      display: block;
                      width: 100%;
                      padding: 16px;
                      background: #48bb78;
                      color: white;
                      text-align: center;
                      border: none;
                      border-radius: 12px;
                      font-weight: 600;
                      font-size: 16px;
                      margin-top: 10px;
                      cursor: pointer;
                      transition: background 0.3s;
                    }
                    .copy-btn:active {
                      background: #38a169;
                    }
                    .copy-btn.copied {
                      background: #38a169;
                    }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <h2>📸 포스터 저장하기</h2>
                    
                    <img src="${dataUrl}" alt="Poster" id="posterImage" />
                    
                    <div class="instructions">
                      <div class="method">
                        <div class="method-title">방법 1: 이미지 길게 누르기</div>
                        <div class="method-desc">위 이미지를 길게 눌러서 "이미지 저장" 선택</div>
                      </div>
                      
                      <div class="method">
                        <div class="method-title">방법 2: 스크린샷</div>
                        <div class="method-desc">전원 + 홈 버튼 또는 전원 + 볼륨 업 버튼</div>
                      </div>
                    </div>
                    
                    <a href="${dataUrl}" download="${fileName}" class="download-link">
                      💾 다운로드 시도하기
                    </a>
                    
                    <button class="copy-btn" onclick="copyImageToClipboard()">
                      📋 이미지 복사하기
                    </button>
                  </div>
                  
                  <script>
                    async function copyImageToClipboard() {
                      try {
                        const img = document.getElementById('posterImage');
                        const response = await fetch(img.src);
                        const blob = await response.blob();
                        
                        if (navigator.clipboard && window.ClipboardItem) {
                          const item = new ClipboardItem({ 'image/png': blob });
                          await navigator.clipboard.write([item]);
                          
                          const btn = document.querySelector('.copy-btn');
                          btn.textContent = '✅ 복사 완료!';
                          btn.classList.add('copied');
                          
                          setTimeout(() => {
                            btn.textContent = '📋 이미지 복사하기';
                            btn.classList.remove('copied');
                          }, 2000);
                        } else {
                          alert('이 브라우저에서는 클립보드 복사가 지원되지 않습니다.');
                        }
                      } catch (error) {
                        console.error('Copy failed:', error);
                        alert('복사에 실패했습니다. 길게 눌러서 저장해주세요.');
                      }
                    }
                    
                    // Auto-save attempt for iOS 15+
                    if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
                      // This would work better with HTTPS
                      console.log('Service Worker available for future enhancement');
                    }
                  </script>
                </body>
              </html>
            `);
            newTab.document.close();
          }
        }
      } else {
        // Desktop and Android - use standard download
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Clean up
        setTimeout(() => URL.revokeObjectURL(url), 100);
      }
    } catch (error) {
      console.error('Download failed:', error);
      alert('포스터 다운로드에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <main className="flex flex-col gap-8 items-center">
        <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100 text-center">
          Poster Generator
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
          클릭하여 포스터를 생성하고 다운로드하세요
        </p>
        <button
          onClick={handleDownload}
          disabled={isLoading}
          className={`
            relative px-8 py-4 rounded-lg font-semibold text-white
            transition-all duration-200 transform
            ${isLoading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 hover:scale-105 active:scale-95'
            }
            shadow-lg hover:shadow-xl
            disabled:hover:scale-100
          `}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle 
                  className="opacity-25" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="4"
                  fill="none"
                />
                <path 
                  className="opacity-75" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              생성 중...
            </span>
          ) : (
            '포스터 다운로드'
          )}
        </button>
        <div className="mt-8 text-sm text-gray-500 dark:text-gray-400 text-center">
          <p>💡 모바일 팁</p>
          <p className="mt-2">iOS: 이미지를 길게 눌러 저장</p>
          <p>Android: 자동으로 다운로드됩니다</p>
        </div>
      </main>
    </div>
  );
}