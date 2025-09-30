class TikTokDownloader {
    constructor() {
        this.apiBaseUrl = '/api/download';
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Enter key support
        document.getElementById('tiktokUrl').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.downloadVideo();
            }
        });

        // Auto-focus on input
        window.addEventListener('load', () => {
            document.getElementById('tiktokUrl').focus();
        });
    }

    async downloadVideo() {
        const urlInput = document.getElementById('tiktokUrl');
        const downloadBtn = document.getElementById('downloadBtn');
        const loading = document.getElementById('loading');
        const result = document.getElementById('result');
        const error = document.getElementById('error');
        
        const tiktokUrl = urlInput.value.trim();
        
        // Validation
        if (!this.isValidTikTokUrl(tiktokUrl)) {
            this.showError('Please enter a valid TikTok URL');
            return;
        }
        
        // UI State
        this.setLoadingState(true);
        this.hideElements([result, error]);
        
        try {
            const videoData = await this.fetchVideoData(tiktokUrl);
            this.displayVideoResult(videoData);
            
        } catch (error) {
            console.error('Download error:', error);
            this.showError(error.message || 'Failed to download video. Please try again.');
        } finally {
            this.setLoadingState(false);
        }
    }

    isValidTikTokUrl(url) {
        const tiktokPatterns = [
            /https?:\/\/(vt|vm)\.tiktok\.com\/\S+/,
            /https?:\/\/(www\.)?tiktok\.com\/@[\w.]+\/video\/\d+/,
            /https?:\/\/(www\.)?tiktok\.com\/t\/\w+\/?/
        ];
        
        return tiktokPatterns.some(pattern => pattern.test(url));
    }

    async fetchVideoData(url) {
        const apiUrl = `${this.apiBaseUrl}?url=${encodeURIComponent(url)}`;
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        
        if (!data.status) {
            throw new Error(data.error || 'Failed to fetch video data');
        }

        return data.data;
    }

    displayVideoResult(videoData) {
        this.displayVideoPreview(videoData);
        this.displayVideoInfo(videoData);
        this.displayDownloadOptions(videoData);
        
        const result = document.getElementById('result');
        result.style.display = 'block';
        result.classList.add('fade-in');
    }

    displayVideoPreview(videoData) {
        const videoPreview = document.getElementById('videoPreview');
        const videoPlayer = document.getElementById('videoPlayer');
        
        if (videoData.meta?.media?.[0]?.org) {
            videoPlayer.src = videoData.meta.media[0].org;
            videoPreview.style.display = 'block';
        } else {
            videoPreview.style.display = 'none';
        }
    }

    displayVideoInfo(videoData) {
        const videoDetails = document.getElementById('videoDetails');
        
        videoDetails.innerHTML = `
            <div class="video-detail">
                <strong>📝 Title:</strong> 
                <span>${this.escapeHtml(videoData.title || 'N/A')}</span>
            </div>
            <div class="video-detail">
                <strong>👤 Author:</strong> 
                <span>${videoData.author?.nickname || 'N/A'} (${videoData.author?.username || 'N/A'})</span>
            </div>
            <div class="video-detail">
                <strong>❤️ Likes:</strong> 
                <span>${videoData.like || '0'}</span>
            </div>
            <div class="video-detail">
                <strong>💬 Comments:</strong> 
                <span>${videoData.comment || '0'}</span>
            </div>
            <div class="video-detail">
                <strong>🔄 Shares:</strong> 
                <span>${videoData.share || '0'}</span>
            </div>
            <div class="video-detail">
                <strong>⏱️ Duration:</strong> 
                <span>${videoData.duration || '0'} seconds</span>
            </div>
            <div class="video-detail">
                <strong>📅 Published:</strong> 
                <span>${videoData.published || 'N/A'}</span>
            </div>
        `;
    }

    displayDownloadOptions(videoData) {
        const downloadButtons = document.getElementById('downloadButtons');
        
        if (!videoData.meta?.media?.[0]) {
            downloadButtons.innerHTML = '<p>No download links available</p>';
            return;
        }

        const media = videoData.meta.media[0];
        let buttonsHTML = '';

        if (media.org) {
            buttonsHTML += `
                <a href="${media.org}" class="download-option-btn" target="_blank" download="tiktok_${videoData.id}_original.mp4">
                    📥 Download Original (${media.size_org})
                </a>
            `;
        }

        if (media.hd) {
            buttonsHTML += `
                <a href="${media.hd}" class="download-option-btn" target="_blank" download="tiktok_${videoData.id}_hd.mp4">
                    🎬 Download HD (${media.size_hd})
                </a>
            `;
        }

        if (media.wm) {
            buttonsHTML += `
                <a href="${media.wm}" class="download-option-btn" target="_blank" download="tiktok_${videoData.id}_watermark.mp4">
                    💧 Download with Watermark (${media.size_wm})
                </a>
            `;
        }

        downloadButtons.innerHTML = buttonsHTML;
    }

    showError(message) {
        const error = document.getElementById('error');
        const errorText = document.getElementById('errorText');
        
        errorText.textContent = message;
        error.style.display = 'block';
        error.classList.add('fade-in');
        
        this.hideElements([document.getElementById('result')]);
    }

    hideError() {
        const error = document.getElementById('error');
        error.style.display = 'none';
    }

    setLoadingState(isLoading) {
        const downloadBtn = document.getElementById('downloadBtn');
        const btnText = downloadBtn.querySelector('.btn-text');
        const btnLoader = downloadBtn.querySelector('.btn-loader');
        const loading = document.getElementById('loading');
        
        if (isLoading) {
            downloadBtn.disabled = true;
            btnText.style.display = 'none';
            btnLoader.style.display = 'inline';
            loading.style.display = 'block';
        } else {
            downloadBtn.disabled = false;
            btnText.style.display = 'inline';
            btnLoader.style.display = 'none';
            loading.style.display = 'none';
        }
    }

    hideElements(elements) {
        elements.forEach(element => {
            if (element) element.style.display = 'none';
        });
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Initialize the application
const tiktokDownloader = new TikTokDownloader();

// Global functions for HTML onclick attributes
function downloadVideo() {
    tiktokDownloader.downloadVideo();
}

function hideError() {
    tiktokDownloader.hideError();
}
