// Phase 19.2 (Evan's call, 16 Oct 2026): the app acknowledges the full game's unlock itself, on
// the phone. The page buys it through version 2 of the Digital Goods API, which leaves
// acknowledging to a server, and Play refunds a purchase nobody acknowledges within three days;
// this game has no server. So whenever the app starts, and whenever the page asks Play anything,
// this acknowledges each purchase that's paid for and isn't yet.
//
// twa/acknowledge.mjs copies it into the project Bubblewrap generates, and hooks it in.
package io.github.rcjlabs.dirtbag;

import android.content.Context;
import com.android.billingclient.api.AcknowledgePurchaseParams;
import com.android.billingclient.api.BillingClient;
import com.android.billingclient.api.BillingClientStateListener;
import com.android.billingclient.api.BillingResult;
import com.android.billingclient.api.PendingPurchasesParams;
import com.android.billingclient.api.Purchase;
import com.android.billingclient.api.QueryPurchasesParams;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

final class PlayAcknowledger {
    // One look at a time: the page can ask Play several things in a row.
    private static final AtomicBoolean looking = new AtomicBoolean(false);

    private PlayAcknowledger() {}

    static void run(Context context) {
        if (!looking.compareAndSet(false, true)) return;
        final BillingClient client =
                BillingClient.newBuilder(context.getApplicationContext())
                        // Purchases are made in the billing library's own activity; this only looks.
                        .setListener((result, purchases) -> {})
                        .enablePendingPurchases(
                                PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())
                        .build();
        final AtomicBoolean ended = new AtomicBoolean(false);
        final Runnable finish =
                () -> {
                    if (!ended.compareAndSet(false, true)) return;
                    client.endConnection();
                    looking.set(false);
                };
        client.startConnection(
                new BillingClientStateListener() {
                    @Override
                    public void onBillingSetupFinished(BillingResult result) {
                        if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                            finish.run();
                            return;
                        }
                        client.queryPurchasesAsync(
                                QueryPurchasesParams.newBuilder()
                                        .setProductType(BillingClient.ProductType.INAPP)
                                        .build(),
                                (queried, purchases) -> acknowledge(client, purchases, finish));
                    }

                    @Override
                    public void onBillingServiceDisconnected() {
                        finish.run();
                    }
                });
    }

    // Each purchase paid for and not yet acknowledged; a pending one waits for its payment.
    private static void acknowledge(BillingClient client, List<Purchase> purchases, Runnable finish) {
        final AtomicInteger left = new AtomicInteger(1);
        for (Purchase p : purchases) {
            if (p.getPurchaseState() != Purchase.PurchaseState.PURCHASED || p.isAcknowledged()) continue;
            left.incrementAndGet();
            client.acknowledgePurchase(
                    AcknowledgePurchaseParams.newBuilder()
                            .setPurchaseToken(p.getPurchaseToken())
                            .build(),
                    (acknowledged) -> {
                        if (left.decrementAndGet() == 0) finish.run();
                    });
        }
        if (left.decrementAndGet() == 0) finish.run();
    }
}
