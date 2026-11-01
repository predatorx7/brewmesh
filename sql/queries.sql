/*
 * BrewMesh SQL Queries
 * Single source of truth for all database operations compiled into typed query runners.
 */

/* @name getViewerContext */
SELECT cafe.viewer_context_json(:userId!) AS result;

/* @name listMenuItems */
SELECT cafe.list_menu_json(:category, :query, :onlyAvailable) AS result;

/* @name topUpWallet */
SELECT cafe.top_up_wallet(:userId!, :amount) AS result;

/* @name placeOrder */
SELECT cafe.place_order(:userId!, :items!::jsonb, :orderedVia, :notes) AS result;

/* @name setTableConnect */
SELECT cafe.set_table_connect(:userId!, :isDiscoverable!, :tableLabel, :statusBlurb) AS result;

/* @name discoverTableConnect */
SELECT cafe.discover_table_connect(:viewerId!, :query) AS result;

/* @name sendTableWave */
SELECT cafe.send_table_wave(:fromUserId!, :toUserId!, :message!) AS result;

/* @name submitRoomVibe */
SELECT cafe.submit_room_vibe(:userId!, :vibe!, :comment!) AS result;

/* @name advanceOrderStatus */
SELECT cafe.advance_order_status(:orderId!, :status!) AS result;

/* @name updateMenuStock */
SELECT cafe.update_menu_stock(:itemId!, :stockDelta, :absoluteStock, :isAvailable) AS result;

/* @name getOwnerDashboard */
SELECT cafe.owner_dashboard_json() AS result;

/* @name listTableGames */
SELECT cafe.list_games_json(:source, :onlyLookingForPlayers) AS result;

/* @name createOrJoinGame */
SELECT cafe.create_or_join_game_json(:action, :gameId, :userId!, :title, :category, :source, :tableNumber, :maxPlayers, :note) AS result;

/* @name findNearbyCafes */
SELECT cafe.find_nearby_cafes_json(:search, :game, :craving, :minChatPartners) AS result;

