package com.kayaku.tabungan;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.Bridge;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        final Bridge bridge = getBridge();
        if (bridge == null) {
            return;
        }

        /*
         * Plugin SystemBars menyuntikkan CSS var --safe-area-inset-* ke
         * document.documentElement saat insets berubah. Inline style tersebut
         * HILANG setiap kali halaman (re)load, sehingga header bisa menabrak
         * status bar. Minta insets diterapkan ulang setelah setiap load agar
         * variabel safe-area selalu tersedia.
         */
        bridge.addWebViewListener(new WebViewListener() {
            @Override
            public void onPageLoaded(WebView webView) {
                super.onPageLoaded(webView);
                webView.post(webView::requestApplyInsets);
            }

            @Override
            public void onPageCommitVisible(WebView view, String url) {
                super.onPageCommitVisible(view, url);
                view.post(view::requestApplyInsets);
            }
        });
    }
}
