-- BrewMesh PostgreSQL Schema & Business Functions
-- Single source of truth for database schema, domains, enums, triggers, and seed data.

CREATE SCHEMA IF NOT EXISTS cafe;
SET search_path TO cafe, public;

-- Domains & Enums
DO $$
BEGIN
	CREATE DOMAIN cafe.user_handle AS TEXT
		CHECK (VALUE ~ '^[a-z0-9_-]{2,40}$');
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
	CREATE DOMAIN cafe.money_inr AS INTEGER
		CHECK (VALUE >= 0 AND VALUE <= 1000000);
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
	CREATE DOMAIN cafe.stock_count AS INTEGER
		CHECK (VALUE >= 0 AND VALUE <= 100000);
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
	CREATE DOMAIN cafe.short_blurb AS TEXT
		CHECK (length(VALUE) <= 280);
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
	CREATE DOMAIN cafe.table_label AS TEXT
		CHECK (length(VALUE) BETWEEN 1 AND 40);
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
	CREATE DOMAIN cafe.short_text AS TEXT
		CHECK (length(VALUE) <= 120);
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
	CREATE TYPE cafe.game_source AS ENUM (
		'CAFE_SHELF',
		'GUEST_BROUGHT'
	);
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
	CREATE TYPE cafe.vibe_mode AS ENUM (
		'DEEP_WORK',
		'SOCIAL_BUZZ',
		'COZY_RAIN'
	);
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
	CREATE TYPE cafe.user_role AS ENUM (
		'customer',
		'owner'
	);
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
	CREATE TYPE cafe.item_category AS ENUM (
		'Coffee',
		'Tea & Coolers',
		'Burgers & Sandwiches',
		'Chips & Sides'
	);
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
	CREATE TYPE cafe.order_status AS ENUM (
		'Pending',
		'Preparing',
		'Ready',
		'Completed'
	);
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
	CREATE TYPE cafe.order_channel AS ENUM (
		'web_ui',
		'webmcp_agent',
		'mcp_server'
	);
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
	CREATE TYPE cafe.vibe_rating AS ENUM (
		'Amazing',
		'Cozy',
		'Productive',
		'Too Cold',
		'Noisy'
	);
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;

-- Tables
CREATE TABLE IF NOT EXISTS cafe.users (
	id cafe.user_handle PRIMARY KEY,
	name TEXT NOT NULL,
	display_name TEXT GENERATED ALWAYS AS (name) STORED,
	role cafe.user_role NOT NULL DEFAULT 'customer',
	avatar TEXT NOT NULL,
	wallet_balance cafe.money_inr NOT NULL DEFAULT 1200,
	is_discoverable BOOLEAN NOT NULL DEFAULT FALSE,
	table_label cafe.table_label,
	status_blurb cafe.short_blurb,
	current_item_summary TEXT,
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cafe.menu_items (
	id SERIAL PRIMARY KEY,
	slug TEXT NOT NULL UNIQUE,
	name TEXT NOT NULL,
	category cafe.item_category NOT NULL,
	description TEXT NOT NULL,
	base_price cafe.money_inr NOT NULL,
	stock_count cafe.stock_count NOT NULL DEFAULT 25,
	is_available BOOLEAN NOT NULL DEFAULT TRUE,
	prep_time_mins INTEGER NOT NULL DEFAULT 5,
	calories INTEGER NOT NULL DEFAULT 150,
	caffeine_mg INTEGER NOT NULL DEFAULT 0,
	tags TEXT[] NOT NULL DEFAULT '{}',
	customization_groups JSONB NOT NULL DEFAULT '[]'::jsonb,
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cafe.orders (
	id SERIAL PRIMARY KEY,
	user_id cafe.user_handle NOT NULL REFERENCES cafe.users(id),
	user_name TEXT NOT NULL,
	table_label TEXT,
	items JSONB NOT NULL,
	total_amount cafe.money_inr NOT NULL,
	status cafe.order_status NOT NULL DEFAULT 'Pending',
	ordered_via cafe.order_channel NOT NULL DEFAULT 'web_ui',
	estimated_wait_mins INTEGER NOT NULL DEFAULT 5,
	notes TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cafe.table_waves (
	id SERIAL PRIMARY KEY,
	from_user_id cafe.user_handle NOT NULL REFERENCES cafe.users(id),
	from_name TEXT NOT NULL,
	from_table TEXT,
	to_user_id cafe.user_handle NOT NULL REFERENCES cafe.users(id),
	message cafe.short_blurb NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cafe.room_vibes (
	id SERIAL PRIMARY KEY,
	user_id cafe.user_handle NOT NULL REFERENCES cafe.users(id),
	user_name TEXT NOT NULL,
	vibe cafe.vibe_rating NOT NULL,
	comment cafe.short_blurb NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cafe.table_games (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	title cafe.short_text NOT NULL,
	category cafe.short_text NOT NULL DEFAULT 'Strategy',
	source cafe.game_source NOT NULL DEFAULT 'CAFE_SHELF',
	host_user_id cafe.user_handle REFERENCES cafe.users(id) ON DELETE SET NULL,
	table_number INTEGER CHECK (table_number IS NULL OR (table_number >= 1 AND table_number <= 50)),
	min_players INTEGER NOT NULL DEFAULT 2 CHECK (min_players >= 1 AND min_players <= 12),
	max_players INTEGER NOT NULL DEFAULT 4 CHECK (max_players >= 1 AND max_players <= 20),
	current_players INTEGER NOT NULL DEFAULT 1 CHECK (current_players >= 0 AND current_players <= 20),
	looking_for_players BOOLEAN NOT NULL DEFAULT TRUE,
	note TEXT,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cafe.nearby_cafes (
	id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
	name cafe.short_text NOT NULL,
	neighborhood cafe.short_text NOT NULL,
	address TEXT NOT NULL,
	distance_km NUMERIC(4, 1) NOT NULL,
	walk_or_drive_mins INTEGER NOT NULL,
	vibe_mode cafe.vibe_mode NOT NULL DEFAULT 'SOCIAL_BUZZ',
	wait_mins INTEGER NOT NULL DEFAULT 4,
	open_to_chat_count INTEGER NOT NULL DEFAULT 3,
	active_game_tables INTEGER NOT NULL DEFAULT 2,
	available_games TEXT[] NOT NULL DEFAULT '{}',
	signature_items TEXT[] NOT NULL DEFAULT '{}',
	featured_blurb TEXT NOT NULL
);

-- JSON Serializer Functions
CREATE OR REPLACE FUNCTION cafe.user_json(u cafe.users)
RETURNS JSONB
LANGUAGE sql
STABLE
AS $$
	SELECT jsonb_build_object(
		'id', u.id,
		'name', u.name,
		'role', u.role,
		'avatar', u.avatar,
		'walletBalance', u.wallet_balance,
		'isDiscoverable', u.is_discoverable,
		'tableLabel', u.table_label,
		'statusBlurb', u.status_blurb,
		'currentItemSummary', u.current_item_summary,
		'updatedAt', to_char(u.updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
	);
$$;

CREATE OR REPLACE FUNCTION cafe.menu_item_json(m cafe.menu_items)
RETURNS JSONB
LANGUAGE sql
STABLE
AS $$
	SELECT jsonb_build_object(
		'id', m.id,
		'slug', m.slug,
		'name', m.name,
		'category', m.category,
		'description', m.description,
		'basePrice', m.base_price,
		'stockCount', m.stock_count,
		'isAvailable', m.is_available,
		'prepTimeMins', m.prep_time_mins,
		'calories', m.calories,
		'caffeineMg', m.caffeine_mg,
		'tags', to_jsonb(m.tags),
		'customizationGroups', m.customization_groups
	);
$$;

CREATE OR REPLACE FUNCTION cafe.order_json(o cafe.orders)
RETURNS JSONB
LANGUAGE sql
STABLE
AS $$
	SELECT jsonb_build_object(
		'id', o.id,
		'userId', o.user_id,
		'userName', o.user_name,
		'tableLabel', o.table_label,
		'items', o.items,
		'totalAmount', o.total_amount,
		'status', o.status,
		'orderedVia', o.ordered_via,
		'estimatedWaitMins', o.estimated_wait_mins,
		'notes', o.notes,
		'createdAt', to_char(o.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
		'updatedAt', to_char(o.updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
	);
$$;

CREATE OR REPLACE FUNCTION cafe.table_game_json(g cafe.table_games, p_host_name TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE sql
STABLE
AS $$
	SELECT jsonb_build_object(
		'id', g.id,
		'title', g.title,
		'category', g.category,
		'source', g.source,
		'hostUserId', g.host_user_id,
		'hostName', p_host_name,
		'tableNumber', g.table_number,
		'minPlayers', g.min_players,
		'maxPlayers', g.max_players,
		'currentPlayers', g.current_players,
		'lookingForPlayers', g.looking_for_players,
		'note', g.note,
		'createdAt', to_char(g.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
	);
$$;

CREATE OR REPLACE FUNCTION cafe.nearby_cafe_json(c cafe.nearby_cafes)
RETURNS JSONB
LANGUAGE sql
STABLE
AS $$
	SELECT jsonb_build_object(
		'id', c.id,
		'name', c.name,
		'neighborhood', c.neighborhood,
		'address', c.address,
		'distanceKm', c.distance_km,
		'walkOrDriveMins', c.walk_or_drive_mins,
		'vibeMode', c.vibe_mode,
		'waitMins', c.wait_mins,
		'openToChatCount', c.open_to_chat_count,
		'activeGameTables', c.active_game_tables,
		'availableGames', to_jsonb(c.available_games),
		'signatureItems', to_jsonb(c.signature_items),
		'featuredBlurb', c.featured_blurb
	);
$$;

-- Business Logic Functions
CREATE OR REPLACE FUNCTION cafe.queue_summary_json()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
	v_pending_count INTEGER;
	v_preparing_count INTEGER;
	v_ready_count INTEGER;
	v_active_count INTEGER;
	v_estimated_wait INTEGER;
	v_crowd_status TEXT;
BEGIN
	SELECT
		COALESCE(COUNT(*) FILTER (WHERE status = 'Pending'), 0),
		COALESCE(COUNT(*) FILTER (WHERE status = 'Preparing'), 0),
		COALESCE(COUNT(*) FILTER (WHERE status = 'Ready'), 0)
	INTO v_pending_count, v_preparing_count, v_ready_count
	FROM cafe.orders
	WHERE status IN ('Pending', 'Preparing', 'Ready');

	v_active_count := v_pending_count + v_preparing_count;
	v_estimated_wait := GREATEST(3, v_active_count * 3);

	IF v_active_count < 3 THEN
		v_crowd_status := 'Quiet';
	ELSIF v_active_count <= 5 THEN
		v_crowd_status := 'Moderate';
	ELSE
		v_crowd_status := 'Busy';
	END IF;

	RETURN jsonb_build_object(
		'activeOrderCount', v_active_count,
		'pendingCount', v_pending_count,
		'preparingCount', v_preparing_count,
		'readyCount', v_ready_count,
		'estimatedWaitMins', v_estimated_wait,
		'crowdStatus', v_crowd_status
	);
END;
$$;

CREATE OR REPLACE FUNCTION cafe.list_menu_json(
	p_category TEXT DEFAULT NULL,
	p_query TEXT DEFAULT NULL,
	p_only_available BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE sql
STABLE
AS $$
	SELECT COALESCE(jsonb_agg(cafe.menu_item_json(m) ORDER BY m.category, m.id), '[]'::jsonb)
	FROM cafe.menu_items m
	WHERE (p_category IS NULL OR m.category::TEXT = p_category)
	  AND (p_only_available IS FALSE OR m.is_available = TRUE)
	  AND (
		p_query IS NULL
		OR m.name ILIKE '%' || p_query || '%'
		OR m.description ILIKE '%' || p_query || '%'
		OR m.category::TEXT ILIKE '%' || p_query || '%'
		OR array_to_string(m.tags, ' ') ILIKE '%' || p_query || '%'
	  );
$$;

CREATE OR REPLACE FUNCTION cafe.discover_table_connect(
	p_viewer_id TEXT,
	p_query TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
	v_people JSONB;
	v_count INTEGER;
BEGIN
	SELECT
		COALESCE(jsonb_agg(cafe.user_json(u) ORDER BY u.updated_at DESC), '[]'::jsonb),
		COUNT(*)
	INTO v_people, v_count
	FROM cafe.users u
	WHERE u.is_discoverable = TRUE
	  AND (
		p_query IS NULL
		OR u.name ILIKE '%' || p_query || '%'
		OR COALESCE(u.status_blurb, '') ILIKE '%' || p_query || '%'
		OR COALESCE(u.table_label, '') ILIKE '%' || p_query || '%'
		OR COALESCE(u.current_item_summary, '') ILIKE '%' || p_query || '%'
	  );

	RETURN jsonb_build_object(
		'discoverableCount', v_count,
		'people', v_people
	);
END;
$$;

CREATE OR REPLACE FUNCTION cafe.viewer_context_json(p_user_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
	v_user cafe.users;
	v_active_orders JSONB;
	v_order_history JSONB;
	v_usual_items JSONB;
	v_incoming_waves JSONB;
	v_queue_summary JSONB;
	v_discoverable_count INTEGER;
	v_companion_nudge TEXT;
BEGIN
	SELECT * INTO v_user FROM cafe.users WHERE id = p_user_id;
	IF NOT FOUND THEN
		RAISE EXCEPTION 'User "%" not found.', p_user_id USING ERRCODE = 'P0002';
	END IF;

	-- Fetch active orders for this viewer
	SELECT COALESCE(jsonb_agg(cafe.order_json(o) ORDER BY o.created_at DESC), '[]'::jsonb)
	INTO v_active_orders
	FROM cafe.orders o
	WHERE o.user_id = p_user_id AND o.status IN ('Pending', 'Preparing', 'Ready');

	-- Fetch completed orders history
	SELECT COALESCE(jsonb_agg(cafe.order_json(o)), '[]'::jsonb)
	INTO v_order_history
	FROM (
		SELECT *
		FROM cafe.orders
		WHERE user_id = p_user_id AND status = 'Completed'
		ORDER BY created_at DESC
		LIMIT 10
	) o;

	-- Determine usual items from order history, falling back to popular items
	SELECT COALESCE(jsonb_agg(cafe.menu_item_json(m)), '[]'::jsonb)
	INTO v_usual_items
	FROM (
		SELECT m.*
		FROM (
			SELECT (elem->>'menuItemId')::INTEGER AS item_id, COUNT(*) AS freq
			FROM cafe.orders o,
			     jsonb_array_elements(o.items) elem
			WHERE o.user_id = p_user_id
			GROUP BY 1
			ORDER BY freq DESC
			LIMIT 4
		) top_user_items
		JOIN cafe.menu_items m ON m.id = top_user_items.item_id
	) m;

	IF jsonb_array_length(v_usual_items) = 0 THEN
		SELECT COALESCE(jsonb_agg(cafe.menu_item_json(m)), '[]'::jsonb)
		INTO v_usual_items
		FROM (
			SELECT *
			FROM cafe.menu_items
			WHERE is_available = TRUE
			ORDER BY id ASC
			LIMIT 3
		) m;
	END IF;

	-- Fetch incoming table waves
	SELECT COALESCE(jsonb_agg(jsonb_build_object(
		'id', w.id,
		'fromUserId', w.from_user_id,
		'fromName', w.from_name,
		'fromTable', w.from_table,
		'toUserId', w.to_user_id,
		'message', w.message,
		'createdAt', to_char(w.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
	)), '[]'::jsonb)
	INTO v_incoming_waves
	FROM (
		SELECT *
		FROM cafe.table_waves
		WHERE to_user_id = p_user_id
		ORDER BY created_at DESC
		LIMIT 10
	) w;

	-- Get queue summary
	v_queue_summary := cafe.queue_summary_json();

	-- Count discoverable users
	SELECT COUNT(*) INTO v_discoverable_count FROM cafe.users WHERE is_discoverable = TRUE;

	-- Provide gentle companion nudge when user is hidden
	IF NOT v_user.is_discoverable THEN
		v_companion_nudge := 'You are currently hidden on Table Connect. Share what you are working on or thinking about so others in the cafe can say hi!';
	ELSE
		v_companion_nudge := NULL;
	END IF;

	RETURN jsonb_build_object(
		'user', cafe.user_json(v_user),
		'activeOrders', v_active_orders,
		'orderHistory', v_order_history,
		'usualItems', v_usual_items,
		'queueSummary', v_queue_summary,
		'incomingWaves', v_incoming_waves,
		'discoverableCount', v_discoverable_count,
		'companionNudge', v_companion_nudge
	);
END;
$$;

CREATE OR REPLACE FUNCTION cafe.top_up_wallet(
	p_user_id TEXT,
	p_amount INTEGER DEFAULT 2000
)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
	v_amount INTEGER;
BEGIN
	v_amount := COALESCE(p_amount, 2000);

	UPDATE cafe.users
	SET wallet_balance = LEAST(1000000, wallet_balance + v_amount),
	    updated_at = NOW()
	WHERE id = p_user_id;

	IF NOT FOUND THEN
		RAISE EXCEPTION 'User "%" not found.', p_user_id USING ERRCODE = 'P0002';
	END IF;

	RETURN cafe.viewer_context_json(p_user_id);
END;
$$;

CREATE OR REPLACE FUNCTION cafe.place_order(
	p_user_id TEXT,
	p_items JSONB,
	p_ordered_via TEXT DEFAULT 'web_ui',
	p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
	v_user cafe.users;
	v_elem JSONB;
	v_item_id INTEGER;
	v_qty INTEGER;
	v_menu_item cafe.menu_items;
	v_cust_key TEXT;
	v_cust_val TEXT;
	v_cust_addons INTEGER;
	v_option_delta INTEGER;
	v_unit_price INTEGER;
	v_line_total INTEGER;
	v_total_amount INTEGER := 0;
	v_max_prep_time INTEGER := 0;
	v_enriched_item JSONB;
	v_enriched_items JSONB := '[]'::jsonb;
	v_summary_parts TEXT[] := '{}'::TEXT[];
	v_item_summary TEXT;
	v_new_balance INTEGER;
	v_estimated_wait INTEGER;
	v_order cafe.orders;
BEGIN
	-- Verify user exists
	SELECT * INTO v_user FROM cafe.users WHERE id = p_user_id FOR UPDATE;
	IF NOT FOUND THEN
		RAISE EXCEPTION 'User "%" not found.', p_user_id USING ERRCODE = 'P0002';
	END IF;

	-- Verify order items
	IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
		RAISE EXCEPTION 'Order items cannot be empty.' USING ERRCODE = '22023';
	END IF;

	-- Process items, calculate prices, and verify stock availability
	FOR v_elem IN SELECT * FROM jsonb_array_elements(p_items) LOOP
		v_item_id := COALESCE((v_elem->>'menuItemId')::INTEGER, (v_elem->>'id')::INTEGER);
		v_qty := GREATEST(1, COALESCE((v_elem->>'quantity')::INTEGER, 1));

		SELECT * INTO v_menu_item FROM cafe.menu_items WHERE id = v_item_id FOR UPDATE;
		IF NOT FOUND THEN
			RAISE EXCEPTION 'Menu item with ID % not found.', v_item_id USING ERRCODE = 'P0002';
		END IF;

		IF NOT v_menu_item.is_available OR v_menu_item.stock_count < v_qty THEN
			RAISE EXCEPTION 'Item "%" is out of stock or unavailable (requested %, in stock %).',
				v_menu_item.name, v_qty, v_menu_item.stock_count USING ERRCODE = 'P0002';
		END IF;

		-- Calculate customization add-on prices
		v_cust_addons := 0;
		IF v_elem ? 'customizations' AND jsonb_typeof(v_elem->'customizations') = 'object' THEN
			FOR v_cust_key, v_cust_val IN SELECT * FROM jsonb_each_text(v_elem->'customizations') LOOP
				SELECT COALESCE(
					(SELECT (opt->>'priceDelta')::INTEGER
					 FROM jsonb_array_elements(v_menu_item.customization_groups) grp,
					      jsonb_array_elements(grp->'options') opt
					 WHERE (grp->>'name' ILIKE v_cust_key OR grp->>'name' ILIKE '%' || v_cust_key || '%')
					   AND (opt->>'label' ILIKE v_cust_val OR v_cust_val ILIKE opt->>'label' || '%')
					 LIMIT 1),
					(SELECT (regexp_matches(v_cust_val, '\+\s*₹?\s*(\d+)'))[1]::INTEGER),
					0
				) INTO v_option_delta;

				v_cust_addons := v_cust_addons + COALESCE(v_option_delta, 0);
			END LOOP;
		END IF;

		v_unit_price := GREATEST(0, v_menu_item.base_price + v_cust_addons);
		v_line_total := v_unit_price * v_qty;
		v_total_amount := v_total_amount + v_line_total;

		v_enriched_item := jsonb_build_object(
			'menuItemId', v_menu_item.id,
			'name', v_menu_item.name,
			'category', v_menu_item.category,
			'basePrice', v_menu_item.base_price,
			'unitPrice', v_unit_price,
			'quantity', v_qty,
			'customizations', COALESCE(v_elem->'customizations', '{}'::jsonb),
			'lineTotal', v_line_total
		);
		v_enriched_items := v_enriched_items || jsonb_build_array(v_enriched_item);
		v_summary_parts := array_append(v_summary_parts, v_qty || 'x ' || v_menu_item.name);
		v_max_prep_time := GREATEST(v_max_prep_time, v_menu_item.prep_time_mins);

		-- Decrement menu item stock count
		UPDATE cafe.menu_items
		SET stock_count = stock_count - v_qty,
		    is_available = (stock_count - v_qty > 0),
		    updated_at = NOW()
		WHERE id = v_menu_item.id;
	END LOOP;

	-- Check wallet balance sufficiency
	IF v_user.wallet_balance < v_total_amount THEN
		RAISE EXCEPTION 'Insufficient wallet balance (have ₹%, need ₹%). Call top_up_wallet to add ₹2,000 INR and retry.',
			v_user.wallet_balance, v_total_amount USING ERRCODE = 'P0003';
	END IF;

	-- Deduct from user wallet balance and update current item summary
	v_item_summary := array_to_string(v_summary_parts, ', ');
	UPDATE cafe.users
	SET wallet_balance = wallet_balance - v_total_amount,
	    current_item_summary = v_item_summary,
	    updated_at = NOW()
	WHERE id = p_user_id
	RETURNING wallet_balance INTO v_new_balance;

	-- Calculate estimated wait time
	SELECT (COALESCE(COUNT(*), 0) * 3) + v_max_prep_time
	INTO v_estimated_wait
	FROM cafe.orders
	WHERE status IN ('Pending', 'Preparing');
	v_estimated_wait := GREATEST(5, v_estimated_wait);

	-- Insert order into database
	INSERT INTO cafe.orders (
		user_id,
		user_name,
		table_label,
		items,
		total_amount,
		status,
		ordered_via,
		estimated_wait_mins,
		notes
	) VALUES (
		v_user.id,
		v_user.name,
		v_user.table_label,
		v_enriched_items,
		v_total_amount,
		'Pending',
		p_ordered_via::cafe.order_channel,
		v_estimated_wait,
		p_notes
	) RETURNING * INTO v_order;

	RETURN jsonb_build_object(
		'order', cafe.order_json(v_order),
		'walletBalance', v_new_balance,
		'queueSummary', cafe.queue_summary_json(),
		'companionNudge', CASE
			WHEN NOT v_user.is_discoverable
			THEN 'Staying a while? Become discoverable on Table Connect and share what you are working on or thinking about!'
			ELSE NULL
		END
	);
END;
$$;

CREATE OR REPLACE FUNCTION cafe.set_table_connect(
	p_user_id TEXT,
	p_is_discoverable BOOLEAN,
	p_table_label TEXT DEFAULT NULL,
	p_status_blurb TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
	v_user cafe.users;
	v_people JSONB;
BEGIN
	UPDATE cafe.users
	SET is_discoverable = p_is_discoverable,
	    table_label = COALESCE(p_table_label, table_label, 'Table 4'),
	    status_blurb = COALESCE(p_status_blurb, status_blurb),
	    updated_at = NOW()
	WHERE id = p_user_id
	RETURNING * INTO v_user;

	IF NOT FOUND THEN
		RAISE EXCEPTION 'User "%" not found.', p_user_id USING ERRCODE = 'P0002';
	END IF;

	v_people := cafe.discover_table_connect(p_user_id, NULL)->'people';

	RETURN jsonb_build_object(
		'user', cafe.user_json(v_user),
		'discoverablePeople', v_people
	);
END;
$$;

CREATE OR REPLACE FUNCTION cafe.send_table_wave(
	p_from_user_id TEXT,
	p_to_user_id TEXT,
	p_message TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
	v_from_user cafe.users;
	v_to_user cafe.users;
	v_wave cafe.table_waves;
BEGIN
	SELECT * INTO v_from_user FROM cafe.users WHERE id = p_from_user_id;
	IF NOT FOUND THEN
		RAISE EXCEPTION 'Sender user "%" not found.', p_from_user_id USING ERRCODE = 'P0002';
	END IF;

	SELECT * INTO v_to_user FROM cafe.users WHERE id = p_to_user_id;
	IF NOT FOUND THEN
		RAISE EXCEPTION 'Recipient user "%" not found.', p_to_user_id USING ERRCODE = 'P0002';
	END IF;

	INSERT INTO cafe.table_waves (
		from_user_id,
		from_name,
		from_table,
		to_user_id,
		message
	) VALUES (
		v_from_user.id,
		v_from_user.name,
		v_from_user.table_label,
		v_to_user.id,
		p_message
	) RETURNING * INTO v_wave;

	RETURN jsonb_build_object(
		'id', v_wave.id,
		'fromUserId', v_wave.from_user_id,
		'fromName', v_wave.from_name,
		'fromTable', v_wave.from_table,
		'toUserId', v_wave.to_user_id,
		'message', v_wave.message,
		'createdAt', to_char(v_wave.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
	);
END;
$$;

CREATE OR REPLACE FUNCTION cafe.submit_room_vibe(
	p_user_id TEXT,
	p_vibe TEXT,
	p_comment TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
	v_user cafe.users;
	v_vibe cafe.room_vibes;
BEGIN
	SELECT * INTO v_user FROM cafe.users WHERE id = p_user_id;
	IF NOT FOUND THEN
		RAISE EXCEPTION 'User "%" not found.', p_user_id USING ERRCODE = 'P0002';
	END IF;

	INSERT INTO cafe.room_vibes (
		user_id,
		user_name,
		vibe,
		comment
	) VALUES (
		v_user.id,
		v_user.name,
		p_vibe::cafe.vibe_rating,
		p_comment
	) RETURNING * INTO v_vibe;

	RETURN jsonb_build_object(
		'id', v_vibe.id,
		'userId', v_vibe.user_id,
		'userName', v_vibe.user_name,
		'vibe', v_vibe.vibe,
		'comment', v_vibe.comment,
		'createdAt', to_char(v_vibe.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
	);
END;
$$;

CREATE OR REPLACE FUNCTION cafe.advance_order_status(
	p_order_id INTEGER,
	p_status TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
	v_order cafe.orders;
BEGIN
	UPDATE cafe.orders
	SET status = p_status::cafe.order_status,
	    updated_at = NOW()
	WHERE id = p_order_id
	RETURNING * INTO v_order;

	IF NOT FOUND THEN
		RAISE EXCEPTION 'Order ID % not found.', p_order_id USING ERRCODE = 'P0002';
	END IF;

	RETURN cafe.order_json(v_order);
END;
$$;

CREATE OR REPLACE FUNCTION cafe.update_menu_stock(
	p_item_id INTEGER,
	p_stock_delta INTEGER DEFAULT NULL,
	p_absolute_stock INTEGER DEFAULT NULL,
	p_is_available BOOLEAN DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
	v_item cafe.menu_items;
	v_new_stock INTEGER;
	v_new_available BOOLEAN;
BEGIN
	SELECT * INTO v_item FROM cafe.menu_items WHERE id = p_item_id FOR UPDATE;
	IF NOT FOUND THEN
		RAISE EXCEPTION 'Menu item ID % not found.', p_item_id USING ERRCODE = 'P0002';
	END IF;

	IF p_absolute_stock IS NOT NULL THEN
		v_new_stock := GREATEST(0, p_absolute_stock);
	ELSIF p_stock_delta IS NOT NULL THEN
		v_new_stock := GREATEST(0, v_item.stock_count + p_stock_delta);
	ELSE
		v_new_stock := v_item.stock_count;
	END IF;

	IF p_is_available IS NOT NULL THEN
		v_new_available := p_is_available;
	ELSE
		v_new_available := (v_new_stock > 0);
	END IF;

	UPDATE cafe.menu_items
	SET stock_count = v_new_stock,
	    is_available = v_new_available,
	    updated_at = NOW()
	WHERE id = p_item_id
	RETURNING * INTO v_item;

	RETURN cafe.menu_item_json(v_item);
END;
$$;

CREATE OR REPLACE FUNCTION cafe.owner_dashboard_json()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
	v_kitchen_queue JSONB;
	v_recent_completed JSONB;
	v_inventory JSONB;
	v_room_vibes JSONB;
	v_queue_summary JSONB;
	v_analytics JSONB;
	v_total_revenue INTEGER;
	v_total_orders INTEGER;
	v_human_orders INTEGER;
	v_agent_orders INTEGER;
	v_avg_order_value INTEGER;
	v_low_stock_count INTEGER;
	v_top_categories JSONB;
BEGIN
	-- Kitchen Queue: active orders
	SELECT COALESCE(jsonb_agg(cafe.order_json(o) ORDER BY o.created_at ASC), '[]'::jsonb)
	INTO v_kitchen_queue
	FROM cafe.orders o
	WHERE o.status IN ('Pending', 'Preparing', 'Ready');

	-- Recent completed orders
	SELECT COALESCE(jsonb_agg(cafe.order_json(o)), '[]'::jsonb)
	INTO v_recent_completed
	FROM (
		SELECT *
		FROM cafe.orders
		WHERE status = 'Completed'
		ORDER BY updated_at DESC
		LIMIT 15
	) o;

	-- Inventory
	SELECT COALESCE(jsonb_agg(cafe.menu_item_json(m) ORDER BY m.stock_count ASC, m.category, m.name), '[]'::jsonb)
	INTO v_inventory
	FROM cafe.menu_items m;

	-- Room Vibes
	SELECT COALESCE(jsonb_agg(jsonb_build_object(
		'id', v.id,
		'userId', v.user_id,
		'userName', v.user_name,
		'vibe', v.vibe,
		'comment', v.comment,
		'createdAt', to_char(v.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
	) ORDER BY v.created_at DESC), '[]'::jsonb)
	INTO v_room_vibes
	FROM (
		SELECT *
		FROM cafe.room_vibes
		ORDER BY created_at DESC
		LIMIT 15
	) v;

	-- Queue Summary
	v_queue_summary := cafe.queue_summary_json();

	-- Analytics
	SELECT
		COALESCE(SUM(total_amount), 0),
		COUNT(*),
		COALESCE(COUNT(*) FILTER (WHERE ordered_via = 'web_ui'), 0),
		COALESCE(COUNT(*) FILTER (WHERE ordered_via IN ('webmcp_agent', 'mcp_server')), 0),
		COALESCE(ROUND(AVG(total_amount)), 0)::INTEGER
	INTO v_total_revenue, v_total_orders, v_human_orders, v_agent_orders, v_avg_order_value
	FROM cafe.orders;

	SELECT COUNT(*)
	INTO v_low_stock_count
	FROM cafe.menu_items
	WHERE stock_count < 10;

	SELECT COALESCE(jsonb_agg(cat_summary), '[]'::jsonb)
	INTO v_top_categories
	FROM (
		SELECT jsonb_build_object(
			'category', (item->>'category'),
			'count', COUNT(*),
			'revenue', SUM((item->>'lineTotal')::INTEGER)
		) AS cat_summary
		FROM cafe.orders o,
		     jsonb_array_elements(o.items) item
		GROUP BY (item->>'category')
		ORDER BY COUNT(*) DESC
	) cats;

	v_analytics := jsonb_build_object(
		'totalRevenueInr', v_total_revenue,
		'totalOrders', v_total_orders,
		'humanOrders', v_human_orders,
		'agentOrders', v_agent_orders,
		'averageOrderValueInr', v_avg_order_value,
		'lowStockItems', v_low_stock_count,
		'topCategories', v_top_categories
	);

	RETURN jsonb_build_object(
		'kitchenQueue', v_kitchen_queue,
		'recentCompleted', v_recent_completed,
		'inventory', v_inventory,
		'analytics', v_analytics,
		'roomVibes', v_room_vibes,
		'queueSummary', v_queue_summary
	);
END;
$$;

CREATE OR REPLACE FUNCTION cafe.list_games_json(
	p_source TEXT DEFAULT NULL,
	p_only_looking BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
	v_games JSONB;
BEGIN
	SELECT COALESCE(
		jsonb_agg(
			cafe.table_game_json(g, u.name)
			ORDER BY g.looking_for_players DESC, g.created_at DESC
		),
		'[]'::jsonb
	)
	INTO v_games
	FROM cafe.table_games g
	LEFT JOIN cafe.users u ON u.id = g.host_user_id
	WHERE (p_source IS NULL OR g.source::TEXT = p_source)
	  AND (COALESCE(p_only_looking, FALSE) IS FALSE OR g.looking_for_players = TRUE);

	RETURN jsonb_build_object('games', v_games);
END;
$$;

CREATE OR REPLACE FUNCTION cafe.create_or_join_game_json(
	p_action TEXT DEFAULT 'HOST',
	p_game_id UUID DEFAULT NULL,
	p_user_id TEXT DEFAULT NULL,
	p_title TEXT DEFAULT NULL,
	p_category TEXT DEFAULT NULL,
	p_source TEXT DEFAULT NULL,
	p_table_number INTEGER DEFAULT NULL,
	p_max_players INTEGER DEFAULT NULL,
	p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
AS $$
DECLARE
	v_game cafe.table_games;
	v_host_name TEXT;
BEGIN
	IF UPPER(COALESCE(p_action, 'HOST')) = 'JOIN' AND p_game_id IS NOT NULL THEN
		UPDATE cafe.table_games
		SET current_players = LEAST(max_players, current_players + 1),
		    looking_for_players = CASE WHEN current_players + 1 >= max_players THEN FALSE ELSE TRUE END
		WHERE id = p_game_id
		RETURNING * INTO v_game;

		IF v_game.id IS NULL THEN
			RAISE EXCEPTION 'Game not found with ID %', p_game_id USING ERRCODE = 'P0002';
		END IF;

		SELECT name INTO v_host_name FROM cafe.users WHERE id = v_game.host_user_id;
		RETURN jsonb_build_object('game', cafe.table_game_json(v_game, v_host_name));
	ELSE
		INSERT INTO cafe.table_games (
			title,
			category,
			source,
			host_user_id,
			table_number,
			min_players,
			max_players,
			current_players,
			looking_for_players,
			note
		) VALUES (
			COALESCE(p_title, 'Catan'),
			COALESCE(p_category, 'Strategy'),
			COALESCE(p_source, 'GUEST_BROUGHT')::cafe.game_source,
			p_user_id,
			COALESCE(p_table_number, 4),
			2,
			COALESCE(p_max_players, 4),
			1,
			TRUE,
			COALESCE(p_note, 'Open for a friendly round at our table!')
		)
		RETURNING * INTO v_game;

		SELECT name INTO v_host_name FROM cafe.users WHERE id = v_game.host_user_id;
		RETURN jsonb_build_object('game', cafe.table_game_json(v_game, v_host_name));
	END IF;
END;
$$;

CREATE OR REPLACE FUNCTION cafe.find_nearby_cafes_json(
	p_search TEXT DEFAULT NULL,
	p_game TEXT DEFAULT NULL,
	p_craving TEXT DEFAULT NULL,
	p_min_chat INTEGER DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
	v_cafes JSONB;
	v_count INTEGER;
BEGIN
	SELECT
		COALESCE(jsonb_agg(cafe.nearby_cafe_json(c) ORDER BY c.distance_km ASC), '[]'::jsonb),
		COUNT(*)
	INTO v_cafes, v_count
	FROM cafe.nearby_cafes c
	WHERE (p_search IS NULL OR c.name ILIKE '%' || p_search || '%' OR c.neighborhood ILIKE '%' || p_search || '%' OR array_to_string(c.available_games, ' ') ILIKE '%' || p_search || '%' OR array_to_string(c.signature_items, ' ') ILIKE '%' || p_search || '%')
	  AND (p_game IS NULL OR array_to_string(c.available_games, ' ') ILIKE '%' || p_game || '%')
	  AND (p_craving IS NULL OR array_to_string(c.signature_items, ' ') ILIKE '%' || p_craving || '%')
	  AND (p_min_chat IS NULL OR c.open_to_chat_count >= p_min_chat);

	RETURN jsonb_build_object(
		'cafes', v_cafes,
		'summary', 'Found ' || v_count || ' nearby BrewMesh cafes matching your preferences.'
	);
END;
$$;

-- PGMB Real-Time Mutation Triggers
DO $$
BEGIN
	IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'pgmb') THEN
		PERFORM pgmb.push_table_mutations('cafe.orders'::regclass);
		PERFORM pgmb.push_table_mutations('cafe.users'::regclass);
		PERFORM pgmb.push_table_mutations('cafe.menu_items'::regclass);
		PERFORM pgmb.push_table_mutations('cafe.table_waves'::regclass);
		PERFORM pgmb.push_table_mutations('cafe.room_vibes'::regclass);
		PERFORM pgmb.push_table_mutations('cafe.table_games'::regclass);
		PERFORM pgmb.push_table_mutations('cafe.nearby_cafes'::regclass);
	END IF;
END $$;

-- Mumbai Cafe Seed Data (Idempotent)
INSERT INTO cafe.users (
	id,
	name,
	role,
	avatar,
	wallet_balance,
	is_discoverable,
	table_label,
	status_blurb,
	current_item_summary
) VALUES
	(
		'syed',
		'Syed',
		'customer',
		'https://api.dicebear.com/7.x/bottts/svg?seed=syed',
		1450,
		FALSE,
		'Table 4',
		'Exploring the new brew bar and tasting single-origin pour-overs.',
		'Malabar Cloud Cold Brew'
	),
	(
		'ananya',
		'Ananya Rao',
		'customer',
		'https://api.dicebear.com/7.x/avataaars/svg?seed=ananya',
		2200,
		TRUE,
		'Window Seat 2',
		'Working on a material science assignment for my company, happy to take a break and meet people in the cafe!',
		'Kokum & Hibiscus Sparkler'
	),
	(
		'kabir',
		'Kabir Mehta',
		'customer',
		'https://api.dicebear.com/7.x/avataaars/svg?seed=kabir',
		1800,
		TRUE,
		'Community Table 1',
		'Reading sci-fi short stories and sketching architectural concepts. Ask me about urban design or book recommendations!',
		'Bandra Cutting Masala Chai'
	),
	(
		'zoya',
		'Zoya Merchant',
		'customer',
		'https://api.dicebear.com/7.x/avataaars/svg?seed=zoya',
		3100,
		TRUE,
		'Booth 6',
		'Debugging distributed Postgres triggers and exploring AI agents. Always up for talking systems or indie music.',
		'Smoked Cinnamon Cortado'
	),
	(
		'owner',
		'Vikram - Cafe Manager & Head Barista',
		'owner',
		'https://api.dicebear.com/7.x/bottts/svg?seed=vikram',
		5000,
		FALSE,
		'Espresso Bar',
		'Crafting specialty brews and calibrating roasts for the Mumbai community.',
		'Ratnagiri Estate Pour-Over (V60)'
	)
ON CONFLICT (id) DO UPDATE SET
	name = EXCLUDED.name,
	avatar = EXCLUDED.avatar,
	table_label = EXCLUDED.table_label,
	status_blurb = EXCLUDED.status_blurb,
	current_item_summary = EXCLUDED.current_item_summary;

INSERT INTO cafe.menu_items (
	id,
	slug,
	name,
	category,
	description,
	base_price,
	stock_count,
	is_available,
	prep_time_mins,
	calories,
	caffeine_mg,
	tags,
	customization_groups
) VALUES
	(
		1,
		'malabar-cloud-cold-brew',
		'Malabar Cloud Cold Brew',
		'Coffee',
		'Steeped for 18 hours with single-origin Monsooned Malabar beans, crowned with aerated sea salt vanilla cloud foam.',
		260,
		35,
		TRUE,
		3,
		90,
		220,
		ARRAY['low-acid', 'smooth', 'high-caffeine', 'rainy-day', 'focus'],
		'[
			{
				"name": "Milk",
				"required": false,
				"options": [
					{"label": "Whole Dairy", "priceDelta": 0},
					{"label": "Oat Milk", "priceDelta": 50},
					{"label": "Almond Milk", "priceDelta": 50}
				]
			},
			{
				"name": "Sweetness",
				"required": false,
				"options": [
					{"label": "Unsweetened", "priceDelta": 0},
					{"label": "Mild Jaggery", "priceDelta": 15},
					{"label": "Vanilla Bean Syrup", "priceDelta": 25}
				]
			},
			{
				"name": "Cold Foam",
				"required": false,
				"options": [
					{"label": "Sea Salt Cloud", "priceDelta": 0},
					{"label": "Extra Cloud Foam", "priceDelta": 35},
					{"label": "Cocoa Dusted Cloud", "priceDelta": 20}
				]
			},
			{
				"name": "Extra Shot",
				"required": false,
				"options": [
					{"label": "Single Cold Shot", "priceDelta": 30},
					{"label": "Double Shot Boost", "priceDelta": 60}
				]
			}
		]'::jsonb
	),
	(
		2,
		'smoked-cinnamon-cortado',
		'Smoked Cinnamon Cortado',
		'Coffee',
		'Equal parts double ristretto and silky steamed milk infused with smoked Kerala cinnamon and nutmeg bark.',
		240,
		28,
		TRUE,
		4,
		110,
		160,
		ARRAY['warm', 'balanced', 'low-milk', 'productivity'],
		'[
			{
				"name": "Milk",
				"required": false,
				"options": [
					{"label": "Whole Dairy", "priceDelta": 0},
					{"label": "Oat Milk", "priceDelta": 50},
					{"label": "Almond Milk", "priceDelta": 50}
				]
			},
			{
				"name": "Bean Roast",
				"required": false,
				"options": [
					{"label": "Medium Dark Roast", "priceDelta": 0},
					{"label": "Light Roast Estate Lot", "priceDelta": 20}
				]
			},
			{
				"name": "Cinnamon Dust",
				"required": false,
				"options": [
					{"label": "Standard Dusting", "priceDelta": 0},
					{"label": "Extra Spiced Rim", "priceDelta": 15}
				]
			}
		]'::jsonb
	),
	(
		3,
		'ratnagiri-pour-over-v60',
		'Ratnagiri Estate Pour-Over (V60)',
		'Coffee',
		'Single-origin lot from Ratnagiri Estate in Chikmagalur with tasting notes of passionfruit, wild honey, and mandarin zest.',
		280,
		20,
		TRUE,
		6,
		5,
		175,
		ARRAY['zero-bitterness', 'fruity-notes', 'gentle-stomach', 'artisan'],
		'[
			{
				"name": "Temperature",
				"required": false,
				"options": [
					{"label": "Hot Chemex Pour", "priceDelta": 0},
					{"label": "Iced Over Rock", "priceDelta": 20}
				]
			},
			{
				"name": "Grind Profile",
				"required": false,
				"options": [
					{"label": "Standard V60 Medium", "priceDelta": 0},
					{"label": "Slow Drip Fine", "priceDelta": 0}
				]
			}
		]'::jsonb
	),
	(
		4,
		'jaggery-oat-iced-latte',
		'Jaggery Oat Iced Latte',
		'Coffee',
		'Organic Kolhapur palm jaggery melted into double-shot South Indian espresso, poured over chilled barista oat milk and ice.',
		270,
		30,
		TRUE,
		4,
		160,
		150,
		ARRAY['sweet', 'energy-boost', 'dairy-free-default', 'cooling'],
		'[
			{
				"name": "Milk",
				"required": false,
				"options": [
					{"label": "Oat Milk", "priceDelta": 0},
					{"label": "Almond Milk", "priceDelta": 0},
					{"label": "Whole Dairy", "priceDelta": -20}
				]
			},
			{
				"name": "Jaggery Level",
				"required": false,
				"options": [
					{"label": "Regular Sweetness", "priceDelta": 0},
					{"label": "Half Jaggery", "priceDelta": 0},
					{"label": "Sugar-Free / No Sweetener", "priceDelta": 0}
				]
			},
			{
				"name": "Ice Level",
				"required": false,
				"options": [
					{"label": "Regular Ice", "priceDelta": 0},
					{"label": "Light Ice", "priceDelta": 0},
					{"label": "No Ice", "priceDelta": 0}
				]
			},
			{
				"name": "Espresso Shot",
				"required": false,
				"options": [
					{"label": "Standard Double", "priceDelta": 0},
					{"label": "Triple Shot", "priceDelta": 50}
				]
			}
		]'::jsonb
	),
	(
		5,
		'bandra-cutting-masala-chai',
		'Bandra Cutting Masala Chai',
		'Tea & Coolers',
		'Hand-crushed ginger, green cardamom, cloves, and lemongrass simmered in Assam CTC black tea and velvety milk.',
		160,
		50,
		TRUE,
		5,
		120,
		55,
		ARRAY['comfort', 'rainy-day', 'ginger-cardamom', 'sore-throat', 'low-cost'],
		'[
			{
				"name": "Milk",
				"required": false,
				"options": [
					{"label": "Whole Dairy", "priceDelta": 0},
					{"label": "Oat Milk", "priceDelta": 40},
					{"label": "Low Fat Dairy", "priceDelta": 0}
				]
			},
			{
				"name": "Spice Level",
				"required": false,
				"options": [
					{"label": "Classic Spice", "priceDelta": 0},
					{"label": "Extra Ginger & Cardamom", "priceDelta": 15},
					{"label": "Mild Spice", "priceDelta": 0}
				]
			},
			{
				"name": "Sugar",
				"required": false,
				"options": [
					{"label": "Cane Sugar", "priceDelta": 0},
					{"label": "Desi Jaggery", "priceDelta": 15},
					{"label": "Sugar Free (Stevia)", "priceDelta": 0}
				]
			}
		]'::jsonb
	),
	(
		6,
		'kyoto-matcha-vanilla-cloud',
		'Kyoto Matcha & Vanilla Cloud',
		'Tea & Coolers',
		'Uji ceremonial grade green tea whisked fresh, layered with Madagascar vanilla bean milk and velvety cold froth.',
		290,
		22,
		TRUE,
		5,
		130,
		70,
		ARRAY['calm-focus', 'l-theanine', 'no-coffee-jitters', 'antioxidant'],
		'[
			{
				"name": "Milk",
				"required": false,
				"options": [
					{"label": "Oat Milk", "priceDelta": 0},
					{"label": "Almond Milk", "priceDelta": 30},
					{"label": "Whole Dairy", "priceDelta": 0}
				]
			},
			{
				"name": "Sweetness",
				"required": false,
				"options": [
					{"label": "Subtle Vanilla", "priceDelta": 0},
					{"label": "Unsweetened Ceremonial", "priceDelta": 0},
					{"label": "Extra Sweet", "priceDelta": 20}
				]
			},
			{
				"name": "Temperature",
				"required": false,
				"options": [
					{"label": "Chilled Over Ice", "priceDelta": 0},
					{"label": "Steamed Warm", "priceDelta": 0}
				]
			}
		]'::jsonb
	),
	(
		7,
		'kokum-hibiscus-sparkler',
		'Kokum & Hibiscus Iced Sparkler',
		'Tea & Coolers',
		'Konkan wild kokum infused with Egyptian dried hibiscus petals, crushed mint, cumin-black salt, and sparkling soda.',
		210,
		40,
		TRUE,
		3,
		75,
		0,
		ARRAY['zero-caffeine', 'hydrating', 'mumbai-heat', 'tangy', 'refreshing'],
		'[
			{
				"name": "Fizz Level",
				"required": false,
				"options": [
					{"label": "Sparkling Club Soda", "priceDelta": 0},
					{"label": "Fresh Coconut Water Base", "priceDelta": 30}
				]
			},
			{
				"name": "Mint & Black Salt",
				"required": false,
				"options": [
					{"label": "Classic Kala Namak", "priceDelta": 0},
					{"label": "Light Salt", "priceDelta": 0},
					{"label": "Extra Mint Crush", "priceDelta": 15}
				]
			},
			{
				"name": "Sweetness",
				"required": false,
				"options": [
					{"label": "Tangy Tart", "priceDelta": 0},
					{"label": "Wildflower Honey Sweetened", "priceDelta": 25},
					{"label": "Low Calorie", "priceDelta": 0}
				]
			}
		]'::jsonb
	),
	(
		8,
		'truffle-shroom-smash-burger',
		'Truffle Shroom & Caramelized Onion Smash Burger',
		'Burgers & Sandwiches',
		'Portobello & oyster mushroom smash patty glazed with thyme truffle butter, sweet balsamic onions, and melt-in-mouth Swiss cheese.',
		380,
		18,
		TRUE,
		10,
		540,
		0,
		ARRAY['high-protein', 'filling', 'savoury', 'comfort-food'],
		'[
			{
				"name": "Bun",
				"required": false,
				"options": [
					{"label": "Brioche Bun", "priceDelta": 0},
					{"label": "Artisan Sourdough", "priceDelta": 30},
					{"label": "Gluten-Free Bun", "priceDelta": 50}
				]
			},
			{
				"name": "Cheese",
				"required": false,
				"options": [
					{"label": "Aged Cheddar", "priceDelta": 0},
					{"label": "Extra Swiss Melt", "priceDelta": 40},
					{"label": "Vegan Cheese", "priceDelta": 40}
				]
			},
			{
				"name": "Spice Level",
				"required": false,
				"options": [
					{"label": "Mild Savoury", "priceDelta": 0},
					{"label": "Peri-Peri Kick", "priceDelta": 20}
				]
			},
			{
				"name": "Add-on",
				"required": false,
				"options": [
					{"label": "Crispy Fried Egg", "priceDelta": 40},
					{"label": "Avocado Slices", "priceDelta": 60}
				]
			}
		]'::jsonb
	),
	(
		9,
		'bombay-gunpowder-grilled-cheese',
		'Bombay Gunpowder Grilled Cheese & Avocado Sandwich',
		'Burgers & Sandwiches',
		'Triple-blend melted mozzarella, English cheddar, and spiced Podi gunpowder butter between toasted sourdough with hass avocado.',
		320,
		24,
		TRUE,
		8,
		480,
		0,
		ARRAY['spicy', 'mumbai-classic', 'crispy', 'breakfast'],
		'[
			{
				"name": "Bread",
				"required": false,
				"options": [
					{"label": "Artisan Sourdough", "priceDelta": 0},
					{"label": "Multigrain Rye", "priceDelta": 20}
				]
			},
			{
				"name": "Spice Level",
				"required": false,
				"options": [
					{"label": "Classic Chutney & Podi", "priceDelta": 0},
					{"label": "Extra Gunpowder Crunch", "priceDelta": 20},
					{"label": "Mild Butter Only", "priceDelta": 0}
				]
			},
			{
				"name": "Add-on",
				"required": false,
				"options": [
					{"label": "Extra Cheese Pull", "priceDelta": 40},
					{"label": "Pickled Jalapenos", "priceDelta": 20}
				]
			}
		]'::jsonb
	),
	(
		10,
		'crispy-periperi-paneer-burger',
		'Crispy Peri-Peri Paneer & Chipotle Brioche Burger',
		'Burgers & Sandwiches',
		'Panko-crusted cottage cheese steak tossed in house African bird''s eye spice, smoky chipotle drizzle, and crunchy purple slaw.',
		360,
		16,
		TRUE,
		9,
		580,
		0,
		ARRAY['spicy', 'crunchy', 'high-energy', 'heavy-meal'],
		'[
			{
				"name": "Bun",
				"required": false,
				"options": [
					{"label": "Toasted Brioche", "priceDelta": 0},
					{"label": "Whole Wheat Bun", "priceDelta": 20}
				]
			},
			{
				"name": "Spice Level",
				"required": false,
				"options": [
					{"label": "Medium Peri-Peri", "priceDelta": 0},
					{"label": "Fiery Bhut Jolokia", "priceDelta": 30},
					{"label": "Lemon & Herb Mild", "priceDelta": 0}
				]
			},
			{
				"name": "Extras",
				"required": false,
				"options": [
					{"label": "Double Cheese", "priceDelta": 40},
					{"label": "Pickled Red Onions", "priceDelta": 15}
				]
			}
		]'::jsonb
	),
	(
		11,
		'herb-egg-cheese-croissant',
		'Classic Herb Egg & Cheese Breakfast Croissant Sandwich',
		'Burgers & Sandwiches',
		'Fluffy pasture-raised French scrambled eggs with fresh chives, dill, melted gouda, and dijon aioli in a butter croissant.',
		290,
		20,
		TRUE,
		7,
		420,
		0,
		ARRAY['morning', 'protein', 'light-stomach', 'flaky'],
		'[
			{
				"name": "Egg Style",
				"required": false,
				"options": [
					{"label": "Soft Creamy Scrambled", "priceDelta": 0},
					{"label": "Fried Sunny Side Up", "priceDelta": 0}
				]
			},
			{
				"name": "Cheese",
				"required": false,
				"options": [
					{"label": "Mild Cheddar", "priceDelta": 0},
					{"label": "Smoked Gouda", "priceDelta": 40}
				]
			},
			{
				"name": "Add-on",
				"required": false,
				"options": [
					{"label": "Chilli Oil Drizzle", "priceDelta": 20},
					{"label": "Crispy Hashbrown Inside", "priceDelta": 50}
				]
			}
		]'::jsonb
	),
	(
		12,
		'peri-peri-crinkle-chips',
		'House-Cut Peri-Peri Crinkle Chips & Dip',
		'Chips & Sides',
		'Golden Russet potato crinkle chips tossed in tangy Mumbai street peri-peri seasoning, served warm with roasted garlic aioli.',
		190,
		45,
		TRUE,
		5,
		310,
		0,
		ARRAY['crispy', 'shareable', 'snack', 'spicy'],
		'[
			{
				"name": "Seasoning",
				"required": false,
				"options": [
					{"label": "Peri-Peri Dust", "priceDelta": 0},
					{"label": "Sea Salt & Rosemary", "priceDelta": 0},
					{"label": "Truffle Parmesan", "priceDelta": 50}
				]
			},
			{
				"name": "Dip",
				"required": false,
				"options": [
					{"label": "Smoked Chipotle Mayo", "priceDelta": 0},
					{"label": "Roasted Garlic Aioli", "priceDelta": 30},
					{"label": "Warm Cheese Fondue", "priceDelta": 50}
				]
			}
		]'::jsonb
	),
	(
		13,
		'truffle-sweet-potato-wedges',
		'Loaded Truffle & Parmesan Sweet Potato Wedges',
		'Chips & Sides',
		'Oven-crisped sweet potato wedges drizzled with white truffle oil, shaved Grana Padano, and cracked Malabar pepper.',
		240,
		30,
		TRUE,
		6,
		340,
		0,
		ARRAY['comfort-snack', 'shareable', 'crispy'],
		'[
			{
				"name": "Seasoning",
				"required": false,
				"options": [
					{"label": "Classic Herbs & Sea Salt", "priceDelta": 0},
					{"label": "Spicy Cajun", "priceDelta": 20}
				]
			},
			{
				"name": "Dip",
				"required": false,
				"options": [
					{"label": "Truffle Aioli", "priceDelta": 0},
					{"label": "Hot Honey", "priceDelta": 30},
					{"label": "Garlic Mayo", "priceDelta": 0}
				]
			}
		]'::jsonb
	),
	(
		14,
		'dark-chocolate-hazelnut-cookie',
		'Warm Dark Chocolate & Sea Salt Hazelnut Cookie',
		'Chips & Sides',
		'Gooey 70% dark Belgian chocolate skillet cookie baked with roasted hazelnuts and finished with fleur de sel.',
		170,
		35,
		TRUE,
		4,
		380,
		15,
		ARRAY['sweet-tooth', 'mood-lifter', 'coffee-pairing'],
		'[
			{
				"name": "Serve",
				"required": false,
				"options": [
					{"label": "Warmed Up", "priceDelta": 0},
					{"label": "Room Temperature", "priceDelta": 0}
				]
			},
			{
				"name": "Add-on",
				"required": false,
				"options": [
					{"label": "Vanilla Bean Gelato Scoop", "priceDelta": 70}
				]
			}
		]'::jsonb
	)
ON CONFLICT (id) DO UPDATE SET
	slug = EXCLUDED.slug,
	name = EXCLUDED.name,
	category = EXCLUDED.category,
	description = EXCLUDED.description,
	base_price = EXCLUDED.base_price,
	stock_count = EXCLUDED.stock_count,
	is_available = EXCLUDED.is_available,
	prep_time_mins = EXCLUDED.prep_time_mins,
	calories = EXCLUDED.calories,
	caffeine_mg = EXCLUDED.caffeine_mg,
	tags = EXCLUDED.tags,
	customization_groups = EXCLUDED.customization_groups;

-- Reset sequence to ensure future inserts succeed smoothly
SELECT setval('cafe.menu_items_id_seq', (SELECT MAX(id) FROM cafe.menu_items));

-- Seed Orders (only insert if orders table is currently empty)
DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM cafe.orders) THEN
		-- Completed orders for 'syed' (for "My Usuals" and order history)
		INSERT INTO cafe.orders (
			user_id,
			user_name,
			table_label,
			items,
			total_amount,
			status,
			ordered_via,
			estimated_wait_mins,
			notes,
			created_at,
			updated_at
		) VALUES
			(
				'syed',
				'Syed',
				'Table 4',
				'[
					{
						"menuItemId": 1,
						"name": "Malabar Cloud Cold Brew",
						"category": "Coffee",
						"basePrice": 260,
						"unitPrice": 260,
						"quantity": 1,
						"customizations": {},
						"lineTotal": 260
					},
					{
						"menuItemId": 14,
						"name": "Warm Dark Chocolate & Sea Salt Hazelnut Cookie",
						"category": "Chips & Sides",
						"basePrice": 170,
						"unitPrice": 170,
						"quantity": 1,
						"customizations": {"Serve": "Warmed Up"},
						"lineTotal": 170
					}
				]'::jsonb,
				430,
				'Completed',
				'web_ui',
				5,
				'Warm cookie please',
				NOW() - INTERVAL '2 hours',
				NOW() - INTERVAL '1 hour 45 minutes'
			),
			(
				'syed',
				'Syed',
				'Table 4',
				'[
					{
						"menuItemId": 8,
						"name": "Truffle Shroom & Caramelized Onion Smash Burger",
						"category": "Burgers & Sandwiches",
						"basePrice": 380,
						"unitPrice": 380,
						"quantity": 1,
						"customizations": {"Bun": "Brioche Bun"},
						"lineTotal": 380
					},
					{
						"menuItemId": 12,
						"name": "House-Cut Peri-Peri Crinkle Chips & Dip",
						"category": "Chips & Sides",
						"basePrice": 190,
						"unitPrice": 190,
						"quantity": 1,
						"customizations": {"Dip": "Roasted Garlic Aioli (+₹30)"},
						"lineTotal": 190
					}
				]'::jsonb,
				570,
				'Completed',
				'web_ui',
				10,
				'Crispy chips please',
				NOW() - INTERVAL '4 hours',
				NOW() - INTERVAL '3 hours 40 minutes'
			),
			(
				'syed',
				'Syed',
				'Table 4',
				'[
					{
						"menuItemId": 1,
						"name": "Malabar Cloud Cold Brew",
						"category": "Coffee",
						"basePrice": 260,
						"unitPrice": 260,
						"quantity": 1,
						"customizations": {},
						"lineTotal": 260
					}
				]'::jsonb,
				260,
				'Completed',
				'webmcp_agent',
				5,
				'Re-ordered via WebMCP companion',
				NOW() - INTERVAL '6 hours',
				NOW() - INTERVAL '5 hours 50 minutes'
			),
			-- Active order 1: Preparing for 'ananya' via webmcp_agent
			(
				'ananya',
				'Ananya Rao',
				'Window Seat 2',
				'[
					{
						"menuItemId": 7,
						"name": "Kokum & Hibiscus Iced Sparkler",
						"category": "Tea & Coolers",
						"basePrice": 210,
						"unitPrice": 210,
						"quantity": 1,
						"customizations": {"Fizz Level": "Sparkling Club Soda"},
						"lineTotal": 210
					},
					{
						"menuItemId": 11,
						"name": "Classic Herb Egg & Cheese Breakfast Croissant Sandwich",
						"category": "Burgers & Sandwiches",
						"basePrice": 290,
						"unitPrice": 290,
						"quantity": 1,
						"customizations": {"Egg Style": "Soft Creamy Scrambled"},
						"lineTotal": 290
					}
				]'::jsonb,
				500,
				'Preparing',
				'webmcp_agent',
				7,
				'Less ice in sparkler',
				NOW() - INTERVAL '8 minutes',
				NOW() - INTERVAL '5 minutes'
			),
			-- Active order 2: Pending for 'kabir' via mcp_server
			(
				'kabir',
				'Kabir Mehta',
				'Community Table 1',
				'[
					{
						"menuItemId": 5,
						"name": "Bandra Cutting Masala Chai",
						"category": "Tea & Coolers",
						"basePrice": 160,
						"unitPrice": 160,
						"quantity": 1,
						"customizations": {"Spice Level": "Extra Ginger & Cardamom (+₹15)"},
						"lineTotal": 160
					},
					{
						"menuItemId": 9,
						"name": "Bombay Gunpowder Grilled Cheese & Avocado Sandwich",
						"category": "Burgers & Sandwiches",
						"basePrice": 320,
						"unitPrice": 320,
						"quantity": 1,
						"customizations": {"Bread": "Artisan Sourdough"},
						"lineTotal": 320
					}
				]'::jsonb,
				480,
				'Pending',
				'mcp_server',
				9,
				'Extra hot cutting chai',
				NOW() - INTERVAL '3 minutes',
				NOW() - INTERVAL '3 minutes'
			);
	END IF;
END $$;

-- Seed Room Vibes
DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM cafe.room_vibes) THEN
		INSERT INTO cafe.room_vibes (
			user_id,
			user_name,
			vibe,
			comment,
			created_at
		) VALUES
			(
				'ananya',
				'Ananya Rao',
				'Productive',
				'The jazz playlist and window seat lighting are dialed in today. Perfect sprint mood.',
				NOW() - INTERVAL '25 minutes'
			),
			(
				'kabir',
				'Kabir Mehta',
				'Cozy',
				'Rain tapping on the glass with fresh cutting chai. Best cafe atmosphere in Bandra.',
				NOW() - INTERVAL '15 minutes'
			),
			(
				'zoya',
				'Zoya Merchant',
				'Amazing',
				'Fast Wi-Fi, incredible cortado, and great conversations at the community table.',
				NOW() - INTERVAL '5 minutes'
			);
	END IF;
END $$;

-- Seed Table Waves
DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM cafe.table_waves) THEN
		INSERT INTO cafe.table_waves (
			from_user_id,
			from_name,
			from_table,
			to_user_id,
			message,
			created_at
		) VALUES
			(
				'ananya',
				'Ananya Rao',
				'Window Seat 2',
				'syed',
				'Hey! Saw you were having the Malabar Cold Brew too. How is it today?',
				NOW() - INTERVAL '12 minutes'
			),
			(
				'kabir',
				'Kabir Mehta',
				'Community Table 1',
				'ananya',
				'Good luck on the material science sprint! Let me know if you want a second pair of eyes.',
				NOW() - INTERVAL '8 minutes'
			);
	END IF;
END $$;

-- Seed Table Games
DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM cafe.table_games) THEN
		INSERT INTO cafe.table_games (
			title,
			category,
			source,
			host_user_id,
			table_number,
			min_players,
			max_players,
			current_players,
			looking_for_players,
			note
		) VALUES
			(
				'Catan',
				'Strategy',
				'CAFE_SHELF',
				NULL,
				4,
				3,
				4,
				2,
				TRUE,
				'Cafe shelf copy at Table 4. Need 2 more players for a relaxed 45-minute game!'
			),
			(
				'Ticket to Ride: India',
				'Family Strategy',
				'CAFE_SHELF',
				NULL,
				8,
				2,
				5,
				3,
				TRUE,
				'Bandra route expansion on shelf. Quick rules teaching before train departs!'
			),
			(
				'Splendor',
				'Engine Building',
				'CAFE_SHELF',
				NULL,
				2,
				2,
				4,
				4,
				FALSE,
				'Full table playing gem development round at Table 2.'
			),
			(
				'Codenames',
				'Party / Word',
				'CAFE_SHELF',
				'zoya',
				6,
				4,
				8,
				5,
				TRUE,
				'Zoya pulled Codenames from the cafe shelf. Spies and spymasters welcome at Booth 6!'
			),
			(
				'Azul',
				'Tile Placement',
				'GUEST_BROUGHT',
				'ananya',
				7,
				2,
				4,
				3,
				TRUE,
				'Brought Azul from home — 1 seat open at Window Seat 2 if you enjoy pattern games and iced matcha.'
			),
			(
				'Wingspan',
				'Engine Building',
				'GUEST_BROUGHT',
				'kabir',
				1,
				1,
				5,
				2,
				TRUE,
				'Brought Wingspan with Oceania expansion! Relaxed bird-watching round at Community Table 1.'
			);
	END IF;
END $$;

-- Seed Nearby Cafes
DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM cafe.nearby_cafes) THEN
		INSERT INTO cafe.nearby_cafes (
			name,
			neighborhood,
			address,
			distance_km,
			walk_or_drive_mins,
			vibe_mode,
			wait_mins,
			open_to_chat_count,
			active_game_tables,
			available_games,
			signature_items,
			featured_blurb
		) VALUES
			(
				'BrewMesh Bandra West (Flagship)',
				'Bandra West',
				'14 Chapel Road, Ranwar Village, Bandra West, Mumbai 400050',
				0.0,
				0,
				'SOCIAL_BUZZ',
				4,
				5,
				3,
				ARRAY['Catan', 'Ticket to Ride: India', 'Splendor', 'Azul', 'Codenames', 'Wingspan'],
				ARRAY['Malabar Cloud Cold Brew', 'Kokum Hibiscus Sparkler', 'Smoked Cinnamon Cortado'],
				'Your current home base! Specialty pour-overs, high-speed mesh Wi-Fi, and active game tables.'
			),
			(
				'Subko Coffee Roasters & Craft Bakehouse',
				'Bandra West',
				'251A, Perry Cross Rd, Bandra West, Mumbai 400050',
				0.8,
				10,
				'SOCIAL_BUZZ',
				12,
				8,
				2,
				ARRAY['Chess', 'Scrabble', 'Hive'],
				ARRAY['Podanur Estate Espresso', 'Salted Chocolate Sourdough Croissant', 'Cascara Tonic'],
				'Vibrant specialty roastery set in a restored vintage cottage with sourdough pastries and lively community buzz.'
			),
			(
				'Blue Tokai Coffee Roasters - Pali Hill',
				'Bandra West',
				'Plot 33, Pali Mala Road, Pali Hill, Mumbai 400050',
				1.2,
				15,
				'DEEP_WORK',
				5,
				3,
				1,
				ARRAY['Backgammon', 'Monopoly Deal', 'Bananagrams'],
				ARRAY['Riverdale Estate Pourover', 'Vietnamese Iced Coffee', 'Almond Croissant'],
				'Quiet tree-lined hideaway ideal for long laptop sessions, clean pour-overs, and light acoustic background music.'
			),
			(
				'Bombay Coffee House - Khar',
				'Khar West',
				'Plot 550, 14th Road, Khar West, Mumbai 400052',
				2.1,
				12,
				'COZY_RAIN',
				6,
				4,
				2,
				ARRAY['Catan', 'Carcassonne', 'Jenga'],
				ARRAY['Classic Filter Kaapi', 'Old Bombay Bun Maska', 'Cortado'],
				'Old-world vintage charm meets modern third-wave brews with comfy armchairs and evening board game sessions.'
			),
			(
				'Kala Ghoda Cafe',
				'Fort / Kala Ghoda',
				'10 Ropewalk Lane, Kala Ghoda, Fort, Mumbai 400001',
				14.5,
				35,
				'COZY_RAIN',
				8,
				6,
				2,
				ARRAY['Ticket to Ride', 'Dixit', 'Chess'],
				ARRAY['KGC Blend Cappuccino', 'Almond Marzipan Cake', 'Waffles with Honey'],
				'Historic heritage art district favorite with brick walls, slow espresso, and creative art conversations.'
			);
	END IF;
END $$;
