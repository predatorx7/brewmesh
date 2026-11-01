/**
 * BrewMesh — Frontend Application & Browser WebMCP Client
 *
 * Implements:
 * - Google Search Home -> Results docking architecture
 * - gemini.google.com dark theme reactive UI
 * - Standards-compliant window.navigator.modelContext WebMCP client with 13 registered tools
 * - Live EventSource SSE consumer for @haathie/pgmb PostgreSQL mutation events
 * - Conversational Gemini Omni-Search & Cafe Companion
 * - Table Connect social discovery and wave dispatching
 * - Barista Kitchen Order Queue (KOT), Room Vibe Pulse, and Owner Analytics
 */

// ============================================================================
// 1. Initial State & Seed Data (Mumbai Connected Cafe)
// ============================================================================

export const MENU_ITEMS = [
	{
		id: 1,
		name: 'Mumbai Cutting Cold Brew',
		category: 'Coffee',
		description: 'Slow-steeped for 18 hours with crushed green cardamom and cinnamon. Low-acidity, naturally sweet profile with dark chocolate finish.',
		price: 220,
		stock: 24,
		isAvailable: true,
		prepTimeMinutes: 3,
		sensoryTags: ['Low-acid', 'Cardamom', 'Chilled', '120mg caffeine'],
		imageUrl: '/assets/cutting-cold-brew.jpg',
		customizations: [
			{
				name: 'Milk Choice',
				required: true,
				options: [
					{ name: 'Black (No Milk)', extraPrice: 0 },
					{ name: 'Oat Milk', extraPrice: 40 },
					{ name: 'Almond Milk', extraPrice: 40 },
					{ name: 'Whole Milk', extraPrice: 0 }
				]
			},
			{
				name: 'Sweetness',
				required: true,
				options: [
					{ name: 'Unsweetened', extraPrice: 0 },
					{ name: 'Organic Jaggery', extraPrice: 20 },
					{ name: 'Wildflower Honey', extraPrice: 20 }
				]
			}
		]
	},
	{
		id: 2,
		name: 'Monsoon Malabar Pour Over',
		category: 'Coffee',
		description: 'Arabica beans exposed to Arabian Sea monsoon winds. Earthy, spicy, thick crema with virtually no harsh acidity.',
		price: 260,
		stock: 18,
		isAvailable: true,
		prepTimeMinutes: 5,
		sensoryTags: ['Low-acid', 'Monsoon winds', 'Spicy earthy', '150mg caffeine'],
		imageUrl: '/assets/monsoon-malabar.jpg',
		customizations: [
			{
				name: 'Grind & Brew Style',
				required: true,
				options: [
					{ name: 'Standard V60 Pour Over', extraPrice: 0 },
					{ name: 'Aeropress Intensive', extraPrice: 20 },
					{ name: 'Chemex Clean Body', extraPrice: 30 }
				]
			},
			{
				name: 'Pour Temperature',
				required: true,
				options: [
					{ name: 'Standard 92°C', extraPrice: 0 },
					{ name: 'Cooler 88°C (Milder notes)', extraPrice: 0 }
				]
			}
		]
	},
	{
		id: 3,
		name: 'Cardamom Cortado',
		category: 'Coffee',
		description: 'Double ristretto cut with an equal volume of warm, velvety cardamom-infused textured milk.',
		price: 210,
		stock: 30,
		isAvailable: true,
		prepTimeMinutes: 4,
		sensoryTags: ['Cardamom', 'Velvety', 'Warm', '130mg caffeine'],
		imageUrl: '/assets/cardamom-cortado.jpg',
		customizations: [
			{
				name: 'Milk Choice',
				required: true,
				options: [
					{ name: 'Whole Milk', extraPrice: 0 },
					{ name: 'Oat Milk', extraPrice: 40 },
					{ name: 'Almond Milk', extraPrice: 40 }
				]
			},
			{
				name: 'Cardamom Intensity',
				required: false,
				options: [
					{ name: 'Subtle Infusion', extraPrice: 0 },
					{ name: 'Double Cardamom Pods', extraPrice: 15 }
				]
			}
		]
	},
	{
		id: 4,
		name: 'Oat Milk Flat White',
		category: 'Coffee',
		description: 'Double shot of Ratnagiri estate espresso with glossy micro-foamed oat milk and delicate latte art.',
		price: 240,
		stock: 12,
		isAvailable: true,
		prepTimeMinutes: 4,
		sensoryTags: ['Creamy', 'Nutty', 'Warm', '130mg caffeine'],
		imageUrl: '/assets/oat-flat-white.jpg',
		customizations: [
			{
				name: 'Espresso Roast',
				required: true,
				options: [
					{ name: 'Medium Roast (Ratnagiri)', extraPrice: 0 },
					{ name: 'Dark Roast (Chikmagalur)', extraPrice: 0 }
				]
			},
			{
				name: 'Extra Shot',
				required: false,
				options: [
					{ name: 'Standard Double', extraPrice: 0 },
					{ name: 'Triple Shot Ristretto', extraPrice: 50 }
				]
			}
		]
	},
	{
		id: 5,
		name: 'Ratnagiri Single-Origin Espresso',
		category: 'Coffee',
		description: 'Bright red cherry, roasted cocoa nibs, and mild citrus notes from the Western Ghats.',
		price: 180,
		stock: 35,
		isAvailable: true,
		prepTimeMinutes: 2,
		sensoryTags: ['Citrus', 'Cocoa', 'Quick pick-me-up', '80mg caffeine'],
		imageUrl: '/assets/espresso.jpg',
		customizations: [
			{
				name: 'Extraction',
				required: true,
				options: [
					{ name: 'Standard Espresso (30ml)', extraPrice: 0 },
					{ name: 'Ristretto Restricted (20ml)', extraPrice: 0 },
					{ name: 'Lungo Extended (45ml)', extraPrice: 0 }
				]
			}
		]
	},
	{
		id: 6,
		name: 'Irani Spiced Chai Latte',
		category: 'Tea & Coolers',
		description: 'Slow-simmered Assam CTC tea with lemongrass, fresh ginger, cracked mace, and condensed milk.',
		price: 190,
		stock: 28,
		isAvailable: true,
		prepTimeMinutes: 3,
		sensoryTags: ['Lemongrass', 'Ginger', 'Comforting', '45mg caffeine'],
		imageUrl: '/assets/irani-chai.jpg',
		customizations: [
			{
				name: 'Spice Level',
				required: true,
				options: [
					{ name: 'Classic Irani Mellow', extraPrice: 0 },
					{ name: 'Extra Ginger Kick', extraPrice: 10 },
					{ name: 'Kadak (Strong)', extraPrice: 15 }
				]
			},
			{
				name: 'Milk Base',
				required: true,
				options: [
					{ name: 'Traditional Condensed Milk', extraPrice: 0 },
					{ name: 'Oat Milk Chai', extraPrice: 30 }
				]
			}
		]
	},
	{
		id: 7,
		name: 'Kokum Sparkling Iced Tea',
		category: 'Tea & Coolers',
		description: 'Konkan sun-dried wild kokum fruit, infused with roasted cumin, garden mint, and sparkling soda.',
		price: 210,
		stock: 22,
		isAvailable: true,
		prepTimeMinutes: 3,
		sensoryTags: ['Tangy', 'Refreshing', 'Caffeine-free', 'Digestive'],
		imageUrl: '/assets/kokum-tea.jpg',
		customizations: [
			{
				name: 'Fizz Level',
				required: true,
				options: [
					{ name: 'Sparkling Club Soda', extraPrice: 0 },
					{ name: 'Still Iced Water', extraPrice: 0 }
				]
			},
			{
				name: 'Sweetness',
				required: true,
				options: [
					{ name: 'Balanced Sweet & Sour', extraPrice: 0 },
					{ name: 'Tart & Spicy (No Added Sugar)', extraPrice: 0 }
				]
			}
		]
	},
	{
		id: 8,
		name: 'Matcha Vanilla Cloud Cooler',
		category: 'Tea & Coolers',
		description: 'Ceremonial grade Uji green tea whisked with cold filtered water, layered under vanilla bean oat milk cold foam.',
		price: 280,
		stock: 15,
		isAvailable: true,
		prepTimeMinutes: 4,
		sensoryTags: ['Antioxidant', 'Velvety', 'Cold foam', '70mg caffeine'],
		imageUrl: '/assets/matcha-cooler.jpg',
		customizations: [
			{
				name: 'Sweetness',
				required: true,
				options: [
					{ name: 'Light Organic Agave', extraPrice: 0 },
					{ name: 'Unsweetened Clean', extraPrice: 0 }
				]
			}
		]
	},
	{
		id: 9,
		name: 'Mumbai Chutney & Truffle Grilled Cheese',
		category: 'Burgers & Sandwiches',
		description: 'Artisanal sourdough stuffed with sharp mature white cheddar, spicy mint-coriander chutney, and white truffle butter.',
		price: 320,
		stock: 20,
		isAvailable: true,
		prepTimeMinutes: 7,
		sensoryTags: ['Spicy chutney', 'Truffle', 'Comforting snack', 'Hot crispy'],
		imageUrl: '/assets/chutney-grilled-cheese.jpg',
		customizations: [
			{
				name: 'Bread Choice',
				required: true,
				options: [
					{ name: 'Country Sourdough', extraPrice: 0 },
					{ name: 'Multigrain Seeded Sourdough', extraPrice: 30 },
					{ name: 'Gluten-Free Bread', extraPrice: 50 }
				]
			},
			{
				name: 'Spice Level',
				required: true,
				options: [
					{ name: 'Mumbai Spicy (Authentic)', extraPrice: 0 },
					{ name: 'Medium Mild Mint', extraPrice: 0 }
				]
			},
			{
				name: 'Add-Ons',
				required: false,
				options: [
					{ name: 'Double Sharp Cheddar', extraPrice: 50 },
					{ name: 'Fried Free-Range Egg', extraPrice: 40 }
				]
			}
		]
	},
	{
		id: 10,
		name: 'BrewMesh Brioche Burger',
		category: 'Burgers & Sandwiches',
		description: 'Spiced crispy sweet potato patty with smoked paprika relish, crunchy house slaw, and caramelized onions on toasted brioche.',
		price: 380,
		stock: 16,
		isAvailable: true,
		prepTimeMinutes: 9,
		sensoryTags: ['Crispy', 'Savory', 'Hearty meal', 'Under ₹400'],
		imageUrl: '/assets/brioche-burger.jpg',
		customizations: [
			{
				name: 'Patty Style',
				required: true,
				options: [
					{ name: 'Crispy Sweet Potato & Herb', extraPrice: 0 },
					{ name: 'Paneer Steak & Garlic Herb', extraPrice: 40 },
					{ name: 'Grilled Smoked Chicken Breast', extraPrice: 60 }
				]
			},
			{
				name: 'Bun Choice',
				required: true,
				options: [
					{ name: 'Buttery Brioche Bun', extraPrice: 0 },
					{ name: 'Whole Wheat Sourdough Bun', extraPrice: 20 }
				]
			},
			{
				name: 'Extra Gourmet Toppings',
				required: false,
				options: [
					{ name: 'Extra Sharp Melted Cheddar', extraPrice: 50 },
					{ name: 'Fresh Hass Avocado Slices', extraPrice: 60 }
				]
			}
		]
	},
	{
		id: 11,
		name: 'Chili Garlic Avocado Toast',
		category: 'Burgers & Sandwiches',
		description: 'Crushed Hass avocado on toasted multigrain sourdough with pickled shallots, Danish feta, and crunchy chili oil.',
		price: 340,
		stock: 14,
		isAvailable: true,
		prepTimeMinutes: 6,
		sensoryTags: ['Creamy', 'Spicy crunch', 'Healthy fat', 'Zesty'],
		imageUrl: '/assets/avocado-toast.jpg',
		customizations: [
			{
				name: 'Cheese Style',
				required: true,
				options: [
					{ name: 'Crumbled Danish Feta', extraPrice: 0 },
					{ name: 'No Cheese (Vegan)', extraPrice: 0 }
				]
			},
			{
				name: 'Poached Egg',
				required: false,
				options: [
					{ name: 'Add Runny Poached Egg', extraPrice: 40 }
				]
			}
		]
	},
	{
		id: 12,
		name: 'Smoked Cheddar & Egg Croissant',
		category: 'Burgers & Sandwiches',
		description: 'Warm French butter croissant baked fresh daily, filled with fluffy folded scrambled eggs, smoked cheddar, and chives.',
		price: 290,
		stock: 8,
		isAvailable: true,
		prepTimeMinutes: 5,
		sensoryTags: ['Flaky', 'Warm breakfast', 'Egg & cheese'],
		imageUrl: '/assets/croissant-egg.jpg',
		customizations: [
			{
				name: 'Sauce',
				required: true,
				options: [
					{ name: 'Dijon Mustard Mayo', extraPrice: 0 },
					{ name: 'Spicy Tomato Chutney', extraPrice: 0 },
					{ name: 'Plain (No Sauce)', extraPrice: 0 }
				]
			}
		]
	},
	{
		id: 13,
		name: 'Peri-Peri Cassava Crisps',
		category: 'Chips & Sides',
		description: 'Hand-cut golden cassava roots fried crisp in cold-pressed groundnut oil, tossed in fiery African peri-peri sea salt.',
		price: 160,
		stock: 32,
		isAvailable: true,
		prepTimeMinutes: 3,
		sensoryTags: ['Crunchy', 'Spicy snack', 'Cassava chips', 'Under ₹200'],
		imageUrl: '/assets/cassava-chips.jpg',
		customizations: [
			{
				name: 'Seasoning Level',
				required: true,
				options: [
					{ name: 'Peri-Peri Spicy Fire', extraPrice: 0 },
					{ name: 'Mild Smoked Sea Salt', extraPrice: 0 }
				]
			},
			{
				name: 'House Dip Choice',
				required: true,
				options: [
					{ name: 'Garlic Herb Aioli', extraPrice: 30 },
					{ name: 'Spicy Mint Mayo', extraPrice: 30 },
					{ name: 'No Dip', extraPrice: 0 }
				]
			}
		]
	},
	{
		id: 14,
		name: 'Gunpowder Truffle Fries',
		category: 'Chips & Sides',
		description: 'Crispy skin-on shoestring potatoes tossed in roasted South Indian podi masala, sea salt, and white truffle oil.',
		price: 220,
		stock: 25,
		isAvailable: true,
		prepTimeMinutes: 5,
		sensoryTags: ['Crispy fries', 'Gunpowder podi', 'Truffle', 'Savory snack'],
		imageUrl: '/assets/truffle-fries.jpg',
		customizations: [
			{
				name: 'Seasoning Blend',
				required: true,
				options: [
					{ name: 'Gunpowder & Truffle', extraPrice: 0 },
					{ name: 'Classic Truffle & Parmesan', extraPrice: 30 }
				]
			},
			{
				name: 'Signature Dip',
				required: true,
				options: [
					{ name: 'Smoked Paprika Dip', extraPrice: 30 },
					{ name: 'House Tomato Dip', extraPrice: 0 }
				]
			}
		]
	}
]

export const PERSONAS = {
	syed: {
		id: 'syed',
		name: 'Syed',
		handle: '@syed',
		avatar: '☕',
		walletBalance: 1450,
		tableLabel: 'Table 4',
		isDiscoverable: false,
		statusBlurb: '',
		currentlySipping: 'Mumbai Cutting Cold Brew',
		usualOrder: {
			menuItemId: 1,
			itemName: 'Mumbai Cutting Cold Brew',
			price: 260,
			customizations: { 'Milk Choice': 'Almond Milk', 'Sweetness': 'Unsweetened' }
		}
	},
	ananya: {
		id: 'ananya',
		name: 'Ananya',
		handle: '@ananya',
		avatar: '👩‍💻',
		walletBalance: 2100,
		tableLabel: 'Table 2',
		isDiscoverable: true,
		statusBlurb: 'Working on generative AI agents & WebMCP protocols. Happy to chat about agent architecture!',
		currentlySipping: 'Oat Milk Flat White',
		icebreaker: 'Ask Ananya about her experience building Chrome WebMCP tools',
		usualOrder: {
			menuItemId: 4,
			itemName: 'Oat Milk Flat White',
			price: 240,
			customizations: { 'Espresso Roast': 'Medium Roast (Ratnagiri)' }
		}
	},
	kabir: {
		id: 'kabir',
		name: 'Kabir',
		handle: '@kabir',
		avatar: '📖',
		walletBalance: 820,
		tableLabel: 'Table 7',
		isDiscoverable: true,
		statusBlurb: 'Reading a book on urban design & sustainable transport in Mumbai. Open to trade book recs.',
		currentlySipping: 'Monsoon Malabar Pour Over',
		icebreaker: 'Ask Kabir what book he is reading today',
		usualOrder: {
			menuItemId: 2,
			itemName: 'Monsoon Malabar Pour Over',
			price: 260,
			customizations: { 'Grind & Brew Style': 'Standard V60 Pour Over', 'Pour Temperature': 'Standard 92°C' }
		}
	},
	zoya: {
		id: 'zoya',
		name: 'Zoya',
		handle: '@zoya',
		avatar: '🚀',
		walletBalance: 3400,
		tableLabel: 'Table 3',
		isDiscoverable: true,
		statusBlurb: 'Finalizing a seed pitch deck for a climate tech startup. Taking a 10 min break!',
		currentlySipping: 'Kokum Sparkling Iced Tea',
		icebreaker: 'Congratulate Zoya on the pitch deck and ask about her startup',
		usualOrder: {
			menuItemId: 7,
			itemName: 'Kokum Sparkling Iced Tea',
			price: 210,
			customizations: { 'Fizz Level': 'Sparkling Club Soda', 'Sweetness': 'Balanced Sweet & Sour' }
		}
	},
	vikram: {
		id: 'vikram',
		name: 'Vikram',
		handle: '@vikram',
		avatar: '👨‍🍳',
		walletBalance: 9500,
		tableLabel: 'Barista Counter',
		isDiscoverable: false,
		statusBlurb: 'Owner & Head Barista at BrewMesh. Keeping brews consistent and room energy high!',
		currentlySipping: 'Ratnagiri Single-Origin Espresso'
	}
}

// Global App State
const state = {
	mode: 'home', // 'home' | 'results'
	activeTab: 'overview', // 'overview' | 'menu' | 'connect' | 'orders' | 'vibe' | 'owner'
	activePersona: 'syed',
	currentUser: { ...PERSONAS.syed },
	menuItems: [...MENU_ITEMS],
	orders: [
		{
			id: 104,
			userId: 'syed',
			customerName: 'Syed',
			tableLabel: 'Table 4',
			status: 'Preparing',
			orderedVia: 'web_ui',
			waitMinutes: 4,
			placedAt: new Date(Date.now() - 3 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
			items: [
				{
					menuItemId: 1,
					itemName: 'Mumbai Cutting Cold Brew',
					quantity: 1,
					price: 260,
					customizations: { 'Milk Choice': 'Almond Milk', 'Sweetness': 'Unsweetened' }
				}
			],
			totalPrice: 260
		},
		{
			id: 101,
			userId: 'ananya',
			customerName: 'Ananya',
			tableLabel: 'Table 2',
			status: 'Preparing',
			orderedVia: 'webmcp_agent',
			waitMinutes: 3,
			placedAt: new Date(Date.now() - 5 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
			items: [
				{
					menuItemId: 4,
					itemName: 'Oat Milk Flat White',
					quantity: 1,
					price: 240,
					customizations: { 'Espresso Roast': 'Medium Roast (Ratnagiri)' }
				}
			],
			totalPrice: 240
		},
		{
			id: 102,
			userId: 'kabir',
			customerName: 'Kabir',
			tableLabel: 'Table 7',
			status: 'Pending',
			orderedVia: 'mcp_server',
			waitMinutes: 7,
			placedAt: new Date(Date.now() - 1 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
			items: [
				{
					menuItemId: 2,
					itemName: 'Monsoon Malabar Pour Over',
					quantity: 1,
					price: 260,
					customizations: { 'Grind & Brew Style': 'Standard V60 Pour Over', 'Pour Temperature': 'Standard 92°C' }
				}
			],
			totalPrice: 260
		}
	],
	pastOrders: [
		{
			id: 98,
			date: 'Yesterday, 4:15 PM',
			items: 'Mumbai Cutting Cold Brew + Peri-Peri Cassava Crisps',
			total: 380,
			status: 'Completed',
			orderedVia: 'webmcp_agent'
		},
		{
			id: 92,
			date: 'Oct 28, 11:30 AM',
			items: 'Cardamom Cortado + Bombay Brioche Burger',
			total: 590,
			status: 'Completed',
			orderedVia: 'web_ui'
		}
	],
	incomingWaves: [
		{
			id: 1,
			fromName: 'Ananya',
			fromTable: 'Table 2',
			time: '5 min ago',
			message: 'Loved your note on distributed systems! Catching up on coffee?'
		}
	],
	roomVibes: [
		{ id: 1, sentiment: 'Amazing', time: '10 min ago', comment: 'Cold brew is so smooth today, and background jazz playlist is 10/10!' },
		{ id: 2, sentiment: 'Productive', time: '25 min ago', comment: 'Fast Wi-Fi, great ambient light near table 2.' },
		{ id: 3, sentiment: 'Too Cold', time: '40 min ago', comment: 'AC vent airflow near window tables is a bit chilly.' },
		{ id: 4, sentiment: 'Cozy', time: '1 hour ago', comment: 'Cardamom cortado warms up the rainy weather outside.' }
	],
	customizerTargetItem: null,
	customizerQuantity: 1,
	customizerSelections: {},
	webmcpTraceLogs: [],
	gameFilter: 'ALL',
	tableGames: [
		{
			id: 'g-catan',
			title: 'Catan',
			category: 'Strategy',
			source: 'CAFE_SHELF',
			hostUserId: null,
			hostName: 'Cafe Shelf (Table 4)',
			tableNumber: 4,
			minPlayers: 3,
			maxPlayers: 4,
			currentPlayers: 2,
			lookingForPlayers: true,
			note: 'Picked from the cafe shelf at Table 4. Looking for 1 or 2 more players for a relaxed 45-minute game!'
		},
		{
			id: 'g-ttr',
			title: 'Ticket to Ride: India',
			category: 'Strategy',
			source: 'CAFE_SHELF',
			hostUserId: null,
			hostName: 'Cafe Shelf (Table 8)',
			tableNumber: 8,
			minPlayers: 2,
			maxPlayers: 5,
			currentPlayers: 3,
			lookingForPlayers: true,
			note: 'Indian Railways map set up at Table 8 — happy to teach the rules in 3 minutes over coffee.'
		},
		{
			id: 'g-codenames',
			title: 'Codenames',
			category: 'Word & Party',
			source: 'CAFE_SHELF',
			hostUserId: 'zoya',
			hostName: 'Zoya Merchant',
			tableNumber: 6,
			minPlayers: 4,
			maxPlayers: 8,
			currentPlayers: 5,
			lookingForPlayers: true,
			note: 'Zoya grabbed Codenames from the cafe shelf! Spies and spymasters welcome at Booth 6.'
		},
		{
			id: 'g-azul',
			title: 'Azul',
			category: 'Tile Placement',
			source: 'GUEST_BROUGHT',
			hostUserId: 'ananya',
			hostName: 'Ananya Rao',
			tableNumber: 2,
			minPlayers: 2,
			maxPlayers: 4,
			currentPlayers: 3,
			lookingForPlayers: true,
			note: 'Brought Azul from home — 1 seat open at Window Seat 2 if you enjoy pattern games and iced coffee.'
		},
		{
			id: 'g-wingspan',
			title: 'Wingspan',
			category: 'Engine Building',
			source: 'GUEST_BROUGHT',
			hostUserId: 'kabir',
			hostName: 'Kabir Mehta',
			tableNumber: 7,
			minPlayers: 1,
			maxPlayers: 5,
			currentPlayers: 2,
			lookingForPlayers: true,
			note: 'Brought Wingspan with the Oceania expansion! Relaxed round starting in 5 minutes at Table 7.'
		},
		{
			id: 'g-splendor',
			title: 'Splendor',
			category: 'Strategy',
			source: 'CAFE_SHELF',
			hostUserId: null,
			hostName: 'Available on Cafe Shelf',
			tableNumber: 2,
			minPlayers: 2,
			maxPlayers: 4,
			currentPlayers: 0,
			lookingForPlayers: false,
			note: 'Available on the cafe games shelf by the espresso bar — grab it for your table anytime.'
		}
	],
	nearbyCafes: [
		{
			id: 'c-bandra',
			name: 'BrewMesh Bandra West (Here)',
			neighborhood: 'Bandra West',
			address: '14 Chapel Road, Ranwar Village, Bandra West',
			distanceKm: 0.0,
			walkOrDriveMins: 1,
			vibeMode: 'Quiet & focused',
			waitMins: 4,
			openToChatCount: 5,
			activeGameTables: 3,
			availableGames: ['Catan', 'Ticket to Ride: India', 'Splendor', 'Azul', 'Codenames', 'Wingspan'],
			signatureItems: ['Mumbai Cutting Cold Brew', 'Bombay Brioche Burger', 'Cardamom Cortado'],
			featuredBlurb: 'Your current cafe! Fresh single-origin pour-overs, 3 active board-game tables, and 5 guests open to chat.'
		},
		{
			id: 'c-subko',
			name: 'Subko Craft Bakehouse & Roastery',
			neighborhood: 'Bandra West',
			address: 'Perry Cross Road, Bandra West',
			distanceKm: 0.8,
			walkOrDriveMins: 10,
			vibeMode: 'Lively social buzz',
			waitMins: 8,
			openToChatCount: 8,
			activeGameTables: 2,
			availableGames: ['Chess', 'Scrabble', 'Hive'],
			signatureItems: ['Podanur Estate Espresso', 'Sourdough Croissant', 'Cascara Tonic'],
			featuredBlurb: 'Garden courtyard in a vintage Bandra cottage with sourdough bakes, chess tables, and 8 people open to meet.'
		},
		{
			id: 'c-bluetokai',
			name: 'Blue Tokai Roastery — Pali Hill',
			neighborhood: 'Pali Hill, Bandra',
			address: 'Pali Mala Road, Pali Hill',
			distanceKm: 1.2,
			walkOrDriveMins: 14,
			vibeMode: 'Quiet & focused',
			waitMins: 5,
			openToChatCount: 3,
			activeGameTables: 1,
			availableGames: ['Backgammon', 'Monopoly Deal', 'Chess'],
			signatureItems: ['Pour-Over', 'Cold Brew', 'Sourdough Toast'],
			featuredBlurb: 'Tree-lined sunlit nook ideal for quiet reading, pour-over flights, and a quick afternoon game.'
		},
		{
			id: 'c-bch',
			name: 'Bombay Coffee House — Khar',
			neighborhood: 'Khar West',
			address: '14th Road, Khar West',
			distanceKm: 2.1,
			walkOrDriveMins: 12,
			vibeMode: 'Cozy rainy-day nook',
			waitMins: 6,
			openToChatCount: 4,
			activeGameTables: 2,
			availableGames: ['Catan', 'Carcassonne', 'Jenga', 'Azul'],
			signatureItems: ['Filter Kaapi', 'Brioche Burger', 'Matcha Latte'],
			featuredBlurb: 'Plush armchairs, warm lamps, and evening Catan & Azul sessions just 12 minutes away.'
		},
		{
			id: 'c-kgc',
			name: 'Kala Ghoda Courtyard Cafe',
			neighborhood: 'Fort / Kala Ghoda',
			address: '10 Ropewalk Lane, Kala Ghoda',
			distanceKm: 14.5,
			walkOrDriveMins: 32,
			vibeMode: 'Creative buzz',
			waitMins: 7,
			openToChatCount: 6,
			activeGameTables: 3,
			availableGames: ['Catan', 'Wingspan', 'Chess', 'Scrabble'],
			signatureItems: ['Cold Brew', 'Almond Cake', 'Matcha Latte'],
			featuredBlurb: 'Heritage arts district cafe with weekend board-game tables and designers open to chat.'
		}
	]
}

// ============================================================================
// 2. WebMCP Client Implementation (window.navigator.modelContext & document.modelContext)
// ============================================================================

class WebModelContextManager {
	#tools = new Map()
	#nativeNavigatorCtx = null
	#nativeDocumentCtx = null

	constructor() {
		if (typeof window !== 'undefined' && 'modelContext' in window.navigator && window.navigator.modelContext) {
			this.#nativeNavigatorCtx = window.navigator.modelContext
		}
		if (typeof document !== 'undefined' && 'modelContext' in document && document.modelContext) {
			this.#nativeDocumentCtx = document.modelContext
		}

		// Install fallback on window.navigator only if the browser does not provide native WebMCP
		if (typeof window !== 'undefined' && !('modelContext' in window.navigator)) {
			window.navigator.modelContext = {
				registerTool: (toolDef) => this.registerTool(toolDef),
				provideContext: (ctx) => this.provideContext(ctx),
				listTools: () => this.listTools(),
				callTool: (name, args) => this.callTool(name, args)
			}
		}
	}

	async registerTool(toolDef) {
		const executableTool = {
			...toolDef,
			description: toolDef.description || toolDef.summary || toolDef.name,
			inputSchema: toolDef.inputSchema || { type: 'object', properties: {} },
			execute: toolDef.execute || (async (input = {}) => {
				const result = await this.callTool(toolDef.name, input)
				return result
			})
		}
		this.#tools.set(toolDef.name, executableTool)
		this.#updateUiToolCount()

		// Also register with Chrome's native WebMCP (navigator.modelContext & document.modelContext)
		// so Chrome DevTools > Application > WebMCP detects every tool immediately!
		for (const nativeCtx of [this.#nativeNavigatorCtx, this.#nativeDocumentCtx]) {
			if (nativeCtx && typeof nativeCtx.registerTool === 'function') {
				try {
					await nativeCtx.registerTool({
						name: executableTool.name,
						description: executableTool.description,
						inputSchema: executableTool.inputSchema,
						execute: executableTool.execute
					})
				} catch {
					// Ignore if already registered on the same context
				}
			}
		}
	}

	provideContext(ctx) {
		if (Array.isArray(ctx?.tools)) {
			for (const tool of ctx.tools) {
				this.registerTool(tool)
			}
		}
		for (const nativeCtx of [this.#nativeNavigatorCtx, this.#nativeDocumentCtx]) {
			if (nativeCtx && typeof nativeCtx.provideContext === 'function' && typeof nativeCtx.registerTool !== 'function') {
				try {
					nativeCtx.provideContext({ tools: Array.from(this.#tools.values()) })
				} catch {
					// Ignore native provideContext error
				}
			}
		}
	}

	listTools() {
		return Array.from(this.#tools.values())
	}

	getTool(name) {
		return this.#tools.get(name)
	}

	async callTool(name, args = {}) {
		const tool = this.#tools.get(name)
		if (!tool) {
			throw new Error(`WebMCP Tool "${name}" not registered on navigator.modelContext`)
		}

		// Log trace in UI
		logWebMcpExecution(name, args)

		// Execute against backend or high-fidelity local fallback
		try {
			const res = await executeToolAction(name, args)
			return res
		} catch (err) {
			console.error(`Tool execution error for ${name}:`, err)
			throw err
		}
	}

	#updateUiToolCount() {
		const el = document.getElementById('webmcp-count')
		if (el) el.textContent = String(this.#tools.size)
	}
}

export const webMcpManager = new WebModelContextManager()

// Register all 13 standard BrewMesh WebMCP tools
async function initializeWebMcpTools() {
	const toolsToRegister = [
		{
			name: 'omni_search_cafe',
			operationId: 'OmniSearchCafe',
			method: 'post',
			path: '/api/omni-search',
			summary: 'Run Gemini-powered Omni-Search and Cafe Companion',
			description: 'Search menu, mood, condition, people, or ask questions. Recommends customized pairings and surfaces discoverable guests.',
			inputSchema: {
				type: 'object',
				properties: {
					query: { type: 'string', description: 'Free-form inquiry, mood, dietary need, or social intent' },
					userId: { type: 'string', default: 'syed', description: 'User handle' }
				},
				required: ['query'],
				additionalProperties: false
			}
		},
		{
			name: 'list_menu_items',
			operationId: 'ListMenuItems',
			method: 'get',
			path: '/api/menu',
			summary: 'List cafe menu items with live stock and customizations',
			description: 'List or filter the BrewMesh cafe menu across Coffee, Tea & Coolers, Burgers & Sandwiches, and Chips & Sides.',
			inputSchema: {
				type: 'object',
				properties: {
					category: { type: 'string', enum: ['Coffee', 'Tea & Coolers', 'Burgers & Sandwiches', 'Chips & Sides'] },
					query: { type: 'string', description: 'Search keyword' },
					onlyAvailable: { type: 'boolean', description: 'Only in-stock items' }
				},
				additionalProperties: false
			}
		},
		{
			name: 'get_viewer_context',
			operationId: 'GetViewerContext',
			method: 'get',
			path: '/api/me',
			summary: 'Retrieve current viewer profile and cafe context',
			description: 'Retrieve active user profile, INR wallet balance, active orders, usuals, and Table Connect presence.',
			inputSchema: {
				type: 'object',
				properties: {
					userId: { type: 'string', default: 'syed', description: 'User handle to inspect' }
				},
				additionalProperties: false
			}
		},
		{
			name: 'place_order',
			operationId: 'PlaceOrder',
			method: 'post',
			path: '/api/orders',
			summary: 'Place a customized food and drink order',
			description: 'Place a customized order for a user, deduct from INR wallet, and queue for kitchen screen.',
			inputSchema: {
				type: 'object',
				properties: {
					userId: { type: 'string', default: 'syed' },
					orderedVia: { type: 'string', default: 'webmcp_agent' },
					notes: { type: 'string' },
					tableLabel: { type: 'string' },
					items: {
						type: 'array',
						items: {
							type: 'object',
							properties: {
								menuItemId: { type: 'integer' },
								quantity: { type: 'integer', default: 1 },
								customizations: { type: 'object' }
							},
							required: ['menuItemId', 'quantity']
						}
					}
				},
				required: ['items'],
				additionalProperties: false
			}
		},
		{
			name: 'top_up_wallet',
			operationId: 'TopUpWallet',
			method: 'post',
			path: '/api/wallet/top-up',
			summary: 'Add funds to a customer wallet',
			description: 'Add simulated INR funds (default 2000 INR) to a user wallet balance.',
			inputSchema: {
				type: 'object',
				properties: {
					userId: { type: 'string', default: 'syed' },
					amount: { type: 'integer', default: 2000 }
				},
				additionalProperties: false
			}
		},
		{
			name: 'discover_table_connect',
			operationId: 'DiscoverTableConnect',
			method: 'get',
			path: '/api/table-connect',
			summary: 'Discover other people opted into Table Connect in the cafe',
			description: 'Surfaces discoverable guests at tables, what they are working on, currently sipping, and conversation starters.',
			inputSchema: {
				type: 'object',
				properties: {
					viewerId: { type: 'string', default: 'syed' },
					query: { type: 'string', description: 'Optional interest or project keyword' }
				},
				additionalProperties: false
			}
		},
		{
			name: 'update_table_connect',
			operationId: 'UpdateTableConnect',
			method: 'put',
			path: '/api/table-connect',
			summary: 'Update Table Connect discoverability and status blurb',
			description: 'Opt in or out of Table Connect, set current table location, and share a status blurb.',
			inputSchema: {
				type: 'object',
				properties: {
					userId: { type: 'string', default: 'syed' },
					isDiscoverable: { type: 'boolean' },
					tableLabel: { type: 'string' },
					statusBlurb: { type: 'string' }
				},
				required: ['isDiscoverable'],
				additionalProperties: false
			}
		},
		{
			name: 'send_table_wave',
			operationId: 'SendTableWave',
			method: 'post',
			path: '/api/table-connect/wave',
			summary: 'Send an icebreaker wave and note to another table',
			description: 'Send a live wave and icebreaker note to another discoverable person in the cafe.',
			inputSchema: {
				type: 'object',
				properties: {
					fromUserId: { type: 'string', default: 'syed' },
					toUserId: { type: 'string' },
					message: { type: 'string' }
				},
				required: ['toUserId'],
				additionalProperties: false
			}
		},
		{
			name: 'submit_room_vibe',
			operationId: 'SubmitRoomVibe',
			method: 'post',
			path: '/api/room-vibes',
			summary: 'Submit room atmosphere and vibe sentiment feedback',
			description: 'Submit live atmosphere sentiment (Understand the Room) to assist cafe team.',
			inputSchema: {
				type: 'object',
				properties: {
					userId: { type: 'string', default: 'syed' },
					sentiment: { type: 'string', enum: ['Amazing', 'Cozy', 'Productive', 'Too Cold', 'Noisy'] },
					category: { type: 'string', default: 'Atmosphere' },
					comment: { type: 'string' }
				},
				required: ['sentiment'],
				additionalProperties: false
			}
		},
		{
			name: 'get_owner_dashboard',
			operationId: 'GetOwnerDashboard',
			method: 'get',
			path: '/api/owner/dashboard',
			summary: 'Retrieve owner and barista operational dashboard',
			description: 'Returns Kitchen Order Queue, inventory stock counts, revenue analytics, and live Room Vibe feedback.',
			inputSchema: {
				type: 'object',
				additionalProperties: false
			}
		},
		{
			name: 'advance_order_status',
			operationId: 'AdvanceOrderStatus',
			method: 'patch',
			path: '/api/owner/orders/{orderId}',
			summary: 'Advance order status in the barista kitchen queue',
			description: 'Update order progress status (Pending -> Preparing -> Ready -> Completed).',
			inputSchema: {
				type: 'object',
				properties: {
					orderId: { type: 'integer' },
					status: { type: 'string', enum: ['Pending', 'Preparing', 'Ready', 'Completed'] }
				},
				required: ['orderId', 'status'],
				additionalProperties: false
			}
		},
		{
			name: 'update_menu_stock',
			operationId: 'UpdateMenuStock',
			method: 'patch',
			path: '/api/owner/menu/{itemId}',
			summary: 'Update menu item stock levels or availability',
			description: 'Update inventory stock count or availability for an item in the cafe.',
			inputSchema: {
				type: 'object',
				properties: {
					itemId: { type: 'integer' },
					stockDelta: { type: 'integer' },
					isAvailable: { type: 'boolean' }
				},
				required: ['itemId'],
				additionalProperties: false
			}
		},
		{
			name: 'ask_owner_analytics',
			operationId: 'AskOwnerAnalytics',
			method: 'post',
			path: '/api/owner/analytics',
			summary: 'Ask natural-language analytics questions for cafe owner',
			description: 'Answers natural-language business and sentiment queries with Gemini 2.5 Flash.',
			inputSchema: {
				type: 'object',
				properties: {
					question: { type: 'string' }
				},
				required: ['question'],
				additionalProperties: false
			}
		},
		{
			name: 'list_games',
			operationId: 'ListGames',
			method: 'get',
			path: '/api/games',
			summary: 'List board games available on the cafe shelf or brought by guests',
			description: 'List active board and tabletop games in the cafe, filtered by source (CAFE_SHELF or GUEST_BROUGHT) and open seats.',
			inputSchema: {
				type: 'object',
				properties: {
					source: { type: 'string', enum: ['CAFE_SHELF', 'GUEST_BROUGHT'] },
					onlyLookingForPlayers: { type: 'boolean', default: false }
				},
				additionalProperties: false
			}
		},
		{
			name: 'create_or_join_game',
			operationId: 'CreateOrJoinGame',
			method: 'post',
			path: '/api/games',
			summary: 'Host a board game at your table or join an existing game',
			description: 'Create a new board game table session (from the cafe shelf or brought from home) or join an existing table looking for players.',
			inputSchema: {
				type: 'object',
				properties: {
					action: { type: 'string', enum: ['HOST', 'JOIN'], default: 'HOST' },
					gameId: { type: 'string' },
					userId: { type: 'string', default: 'syed' },
					title: { type: 'string' },
					category: { type: 'string', default: 'Strategy' },
					source: { type: 'string', enum: ['CAFE_SHELF', 'GUEST_BROUGHT'], default: 'GUEST_BROUGHT' },
					tableNumber: { type: 'integer', default: 4 },
					maxPlayers: { type: 'integer', default: 4 },
					note: { type: 'string' }
				},
				required: ['userId'],
				additionalProperties: false
			}
		},
		{
			name: 'find_nearby_cafes',
			operationId: 'FindNearbyCafes',
			method: 'get',
			path: '/api/cafes/nearby',
			summary: 'Find nearest specialty cafes by board games, food/drink cravings, or people open to chat',
			description: 'Find nearby specialty cafes across Mumbai filtered by available board games, signature food/drink cravings, or open-to-chat guests.',
			inputSchema: {
				type: 'object',
				properties: {
					search: { type: 'string' },
					game: { type: 'string' },
					craving: { type: 'string' },
					minChatPartners: { type: 'integer' }
				},
				additionalProperties: false
			}
		}
	]

	for (const tool of toolsToRegister) {
		await webMcpManager.registerTool(tool)
	}

	renderWebMcpDrawerCatalogue()
}

// ============================================================================
// 3. Execution Engine: API / Local Fallback with Live UI Synchronization
// ============================================================================

async function executeToolAction(name, args) {
	switch (name) {
		case 'omni_search_cafe': {
			const query = args.query || ''
			return handleOmniSearch(query)
		}
		case 'list_menu_items': {
			let items = [...state.menuItems]
			if (args.category && args.category !== 'All') {
				items = items.filter(i => i.category === args.category)
			}
			if (args.query) {
				const q = args.query.toLowerCase()
				items = items.filter(i =>
					i.name.toLowerCase().includes(q) ||
					i.description.toLowerCase().includes(q) ||
					i.sensoryTags.some(t => t.toLowerCase().includes(q))
				)
			}
			if (args.onlyAvailable) {
				items = items.filter(i => i.isAvailable && i.stock > 0)
			}
			return { items, count: items.length }
		}
		case 'get_viewer_context': {
			return {
				user: state.currentUser,
				activeOrders: state.orders.filter(o => o.userId === state.currentUser.id),
				pastOrders: state.pastOrders,
				incomingWaves: state.incomingWaves
			}
		}
		case 'place_order': {
			const items = args.items || []
			let orderTotal = 0
			const processedItems = []

			for (const reqItem of items) {
				const menuItem = state.menuItems.find(m => m.id === reqItem.menuItemId)
				if (!menuItem) continue
				let itemPrice = menuItem.price
				if (reqItem.customizations) {
					for (const [groupName, optionName] of Object.entries(reqItem.customizations)) {
						const group = menuItem.customizations.find(g => g.name === groupName)
						const option = group?.options.find(o => o.name === optionName)
						if (option) itemPrice += option.extraPrice
					}
				}
				const qty = reqItem.quantity || 1
				orderTotal += itemPrice * qty
				processedItems.push({
					menuItemId: menuItem.id,
					itemName: menuItem.name,
					quantity: qty,
					price: itemPrice * qty,
					customizations: reqItem.customizations || {}
				})
			}

			if (state.currentUser.walletBalance < orderTotal) {
				throw new Error(`Insufficient wallet balance. Total is ₹${orderTotal}, but wallet balance is ₹${state.currentUser.walletBalance}. Call top_up_wallet first.`)
			}

			// Deduct balance
			state.currentUser.walletBalance -= orderTotal
			const newOrderId = Math.floor(100 + Math.random() * 900)
			const newOrder = {
				id: newOrderId,
				userId: state.currentUser.id,
				customerName: state.currentUser.name,
				tableLabel: args.tableLabel || state.currentUser.tableLabel || 'Table 4',
				status: 'Pending',
				orderedVia: args.orderedVia || 'webmcp_agent',
				waitMinutes: 4,
				placedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
				items: processedItems,
				totalPrice: orderTotal
			}

			state.orders.unshift(newOrder)

			// Update UI
			renderWallet()
			renderOrders()
			renderKitchenQueue()
			showToast(`Order #${newOrderId} placed successfully! (-₹${orderTotal})`, 'toast-success')

			// Switch to Orders Tab so user sees immediate feedback
			switchTab('orders')

			return {
				success: true,
				orderId: newOrderId,
				totalCharged: orderTotal,
				remainingBalance: state.currentUser.walletBalance,
				companionNudge: !state.currentUser.isDiscoverable ? 'You are currently hidden on Table Connect. Share what you are working on or thinking about so others can say hi!' : null
			}
		}
		case 'top_up_wallet': {
			const amount = Number(args.amount) || 2000
			state.currentUser.walletBalance += amount
			renderWallet()
			showToast(`Added ₹${amount.toLocaleString()} INR to your wallet!`, 'toast-success')
			return {
				success: true,
				addedAmount: amount,
				newBalance: state.currentUser.walletBalance
			}
		}
		case 'discover_table_connect': {
			const people = Object.values(PERSONAS).filter(p => p.isDiscoverable && p.id !== state.currentUser.id)
			return { people, total: people.length }
		}
		case 'update_table_connect': {
			state.currentUser.isDiscoverable = Boolean(args.isDiscoverable)
			if (args.tableLabel) state.currentUser.tableLabel = args.tableLabel
			if (typeof args.statusBlurb === 'string') state.currentUser.statusBlurb = args.statusBlurb

			renderTableConnect()
			renderSidebarProfile()
			renderHeroOptinCard()
			showToast(state.currentUser.isDiscoverable ? 'You are now discoverable on Table Connect!' : 'You are now hidden on Table Connect.', 'toast-info')

			return {
				success: true,
				profile: {
					userId: state.currentUser.id,
					isDiscoverable: state.currentUser.isDiscoverable,
					tableLabel: state.currentUser.tableLabel,
					statusBlurb: state.currentUser.statusBlurb
				}
			}
		}
		case 'send_table_wave': {
			const targetUser = Object.values(PERSONAS).find(p => p.id === args.toUserId)
			const senderName = state.currentUser.name
			const newWave = {
				id: Date.now(),
				fromName: senderName,
				fromTable: state.currentUser.tableLabel,
				time: 'Just now',
				message: args.message || `Friendly wave from ${senderName} at ${state.currentUser.tableLabel}!`
			}
			state.incomingWaves.unshift(newWave)
			renderIncomingWaves()
			showToast(`Wave delivered to ${targetUser?.name || args.toUserId} at table!`, 'toast-wave')
			return { success: true, deliveredTo: targetUser?.name || args.toUserId }
		}
		case 'submit_room_vibe': {
			const newVibe = {
				id: Date.now(),
				sentiment: args.sentiment,
				time: 'Just now',
				comment: args.comment || `${args.sentiment} vibe shared by guest.`
			}
			state.roomVibes.unshift(newVibe)
			renderRoomVibes()
			showToast('Thank you for sharing your room vibe!', 'toast-info')
			return { success: true, vibeId: newVibe.id }
		}
		case 'get_owner_dashboard': {
			return {
				ordersQueue: state.orders,
				inventory: state.menuItems,
				metrics: {
					revenue: 14820,
					totalOrders: 48,
					agentSplitPct: 58,
					sentimentScorePct: 92
				}
			}
		}
		case 'advance_order_status': {
			const orderId = Number(args.orderId)
			const order = state.orders.find(o => o.id === orderId)
			if (!order) throw new Error(`Order #${orderId} not found`)
			order.status = args.status
			renderOrders()
			renderKitchenQueue()
			showToast(`Order #${orderId} moved to ${args.status}`, 'toast-info')
			return { success: true, orderId, newStatus: args.status }
		}
		case 'update_menu_stock': {
			const itemId = Number(args.itemId)
			const item = state.menuItems.find(m => m.id === itemId)
			if (!item) throw new Error(`Menu item #${itemId} not found`)
			if (typeof args.stockDelta === 'number') {
				item.stock = Math.max(0, item.stock + args.stockDelta)
			}
			if (typeof args.isAvailable === 'boolean') {
				item.isAvailable = args.isAvailable
			}
			renderFullMenu()
			renderInventoryTable()
			showToast(`Updated stock for ${item.name} (${item.stock} in stock)`, 'toast-info')
			return { success: true, item }
		}
		case 'ask_owner_analytics': {
			const q = args.question || ''
			let answer = 'Based on live orders today: Oat milk flat white is the highest velocity beverage (+34% week-on-week). The Brioche Burger leads afternoon food orders with 80% opting for sweet potato or paneer. Recommendation: restock 10 oat milk cartons before 4:00 PM.'
			if (q.toLowerCase().includes('sentiment') || q.toLowerCase().includes('room') || q.toLowerCase().includes('vibe')) {
				answer = 'Customer room sentiment is 92% positive. Key observation: 2 guests near window tables noted brisk AC airflow. Barista recommendation: increase temperature setpoint to 24°C.'
			}
			return { answer }
		}
		case 'list_games': {
			let games = [...state.tableGames]
			if (args.source) {
				games = games.filter(g => g.source === args.source)
			}
			if (args.onlyLookingForPlayers) {
				games = games.filter(g => g.lookingForPlayers)
			}
			return { games }
		}
		case 'create_or_join_game': {
			const action = String(args.action || 'HOST').toUpperCase()
			if (action === 'JOIN' && args.gameId) {
				const game = state.tableGames.find(g => String(g.id) === String(args.gameId))
				if (!game) throw new Error('Selected game session was not found.')
				game.currentPlayers = Math.min(game.maxPlayers, game.currentPlayers + 1)
				if (game.currentPlayers >= game.maxPlayers) {
					game.lookingForPlayers = false
				}
				renderGamesGrid(state.gameFilter, false)
				showToast(`Joined ${game.title} at Table ${game.tableNumber || 4}!`, 'toast-success')
				return { game }
			}
			const newGame = {
				id: `g-${Date.now()}`,
				title: args.title || 'Catan',
				category: args.category || 'Strategy',
				source: args.source || 'GUEST_BROUGHT',
				hostUserId: state.currentUser.id,
				hostName: state.currentUser.name,
				tableNumber: Number(String(args.tableNumber || '4').replace(/\D/g, '')) || 4,
				minPlayers: 2,
				maxPlayers: Number(args.maxPlayers) || 4,
				currentPlayers: 1,
				lookingForPlayers: true,
				note: args.note || 'Open for a friendly round at our table — come say hi!'
			}
			state.tableGames.unshift(newGame)
			renderGamesGrid(state.gameFilter, false)
			showToast(`Listed "${newGame.title}" at Table ${newGame.tableNumber}!`, 'toast-success')
			return { game: newGame }
		}
		case 'find_nearby_cafes': {
			let cafes = [...state.nearbyCafes]
			if (args.search) {
				const q = args.search.toLowerCase()
				cafes = cafes.filter(c =>
					c.name.toLowerCase().includes(q) ||
					c.neighborhood.toLowerCase().includes(q) ||
					c.availableGames.some(g => g.toLowerCase().includes(q)) ||
					c.signatureItems.some(s => s.toLowerCase().includes(q))
				)
			}
			if (args.game) {
				const g = args.game.toLowerCase()
				cafes = cafes.filter(c => c.availableGames.some(item => item.toLowerCase().includes(g)))
			}
			if (args.craving) {
				const cr = args.craving.toLowerCase()
				cafes = cafes.filter(c => c.signatureItems.some(item => item.toLowerCase().includes(cr)))
			}
			if (args.minChatPartners) {
				cafes = cafes.filter(c => c.openToChatCount >= Number(args.minChatPartners))
			}
			return {
				cafes,
				summary: `Showing ${cafes.length} specialty cafe${cafes.length === 1 ? '' : 's'} nearby`
			}
		}
		default:
			throw new Error(`Unknown WebMCP tool: ${name}`)
	}
}

// Render 420ms Graceful Skeleton Shimmers
export function renderShimmerCards(container, count = 4) {
	if (!container) return
	container.innerHTML = Array.from({ length: count }).map(() => `
		<div class="shimmer-card" aria-hidden="true">
			<div class="shimmer-badge"></div>
			<div class="shimmer-title"></div>
			<div class="shimmer-line"></div>
			<div class="shimmer-line short"></div>
			<div class="shimmer-footer"></div>
		</div>
	`).join('')
}

// Log WebMCP Tool Executions to the Trace Bar
function logWebMcpExecution(toolName, args) {
	const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
	state.webmcpTraceLogs.unshift({ toolName, args, timestamp })

	const traceSummaryEl = document.getElementById('trace-summary')
	const traceChipsList = document.getElementById('trace-chips-list')

	if (traceSummaryEl) {
		traceSummaryEl.textContent = `Executed 🛠️ ${toolName} at ${timestamp}`
	}

	if (traceChipsList) {
		const chip = document.createElement('div')
		chip.className = 'trace-chip'
		chip.innerHTML = `<span>🛠️ ${toolName}</span><span class="chip-time">${timestamp}</span>`
		traceChipsList.prepend(chip)

		// Limit to 6 visible trace chips
		while (traceChipsList.children.length > 6) {
			traceChipsList.removeChild(traceChipsList.lastChild)
		}
	}
}

// ============================================================================
// 4. Omni-Search & Conversational Cafe Companion Engine (With 420ms Shimmer)
// ============================================================================

export async function handleOmniSearch(query) {
	if (!query || !query.trim()) return

	// Switch layout to Results mode and Menu tab
	setAppMode('results')
	switchTab('menu', false)

	// Update search inputs
	const heroInput = document.getElementById('omni-search-input')
	if (heroInput) heroInput.value = query

	const q = query.toLowerCase()

	// Thinking animation on search input shell + 420ms skeleton shimmer
	const inputShell = document.querySelector('.omni-search-input-shell')
	const fullMenuGrid = document.getElementById('full-menu-grid')
	const recSection = document.getElementById('recommendations-section')
	const recGrid = document.getElementById('recommended-items-grid')

	if (inputShell) inputShell.classList.add('thinking')
	if (recSection) recSection.classList.remove('hidden')
	renderShimmerCards(recGrid, 2)
	renderShimmerCards(fullMenuGrid, 4)

	await new Promise(resolve => setTimeout(resolve, 420))
	if (inputShell) inputShell.classList.remove('thinking')

	// Curate Recommendations based on natural language intent
	let recommended = []
	let answerText = ''
	let showPeople = false

	if (q.includes('rainy') || q.includes('sleepy') || q.includes('low-acid') || q.includes('afternoon')) {
		recommended = [
			{
				...state.menuItems[0], // Mumbai Cutting Cold Brew
				geminiReason: 'Slow-steeped for 18 hours with green cardamom and almond milk — gentle on the stomach with a smooth lift.'
			},
			{
				...state.menuItems[12], // Peri-Peri Cassava Crisps
				geminiReason: 'Warm peri-peri spiced cassava crisps bring a comforting crunch for a rainy Mumbai afternoon.'
			}
		]
		answerText = `For a <strong>sleepy, rainy Mumbai afternoon</strong>, our <strong>Mumbai Cutting Cold Brew</strong> (18-hour low-acid steep with green cardamom) paired with <strong>Peri-Peri Cassava Crisps</strong> gives you warmth and focus without a harsh caffeine spike.`
	} else if (q.includes('burger') || q.includes('combo') || q.includes('600')) {
		recommended = [
			{
				...state.menuItems[9], // BrewMesh Brioche Burger
				geminiReason: 'Toasted butter brioche bun with spiced patty and smoked paprika relish (₹380).'
			},
			{
				...state.menuItems[12], // Peri-Peri Cassava Crisps
				geminiReason: 'Crispy cassava chips (₹160) — brings your combo to ₹540, comfortably under ₹600.'
			}
		]
		answerText = `Here is a <strong>burger and crisps pairing under ₹600</strong>: our <strong>BrewMesh Brioche Burger (₹380)</strong> with <strong>Peri-Peri Cassava Crisps (₹160)</strong> comes to <strong>₹540</strong>.`
	} else if (q.includes('game') || q.includes('catan') || q.includes('chess') || q.includes('play')) {
		switchTab('games', false)
		await renderGamesGrid('ALL', true)
		return {
			answer: 'Opened the board games lounge showing games on the cafe shelf and games brought by fellow guests.',
			recommendationsCount: state.tableGames.length,
			showPeople: true
		}
	} else if (q.includes('nearest') || q.includes('nearby') || q.includes('other cafe')) {
		switchTab('cafes', false)
		await renderNearbyCafesGrid(true)
		return {
			answer: 'Showing nearby specialty cafes with board games, signature drinks, and open tables.',
			recommendationsCount: state.nearbyCafes.length,
			showPeople: false
		}
	} else if (q.includes('material science') || q.includes('assignment') || q.includes('meet') || q.includes('discoverable') || q.includes('who is') || q.includes('chat')) {
		showPeople = true
		recommended = [
			{
				...state.menuItems[3], // Oat Milk Flat White
				geminiReason: 'Ratnagiri single-origin espresso with velvety oat microfoam — great company for focused work and table chats.'
			}
		]
		answerText = `You're working on a <strong>material science assignment</strong> and open to saying hello! We've updated your table status and highlighted <strong>3 guests nearby</strong> who are also open to chat.`
	} else if (q.includes('reorder') || q.includes('usual') || q.includes('cold brew')) {
		recommended = [
			{
				...state.menuItems[0],
				geminiReason: 'Your usual: Almond milk, unsweetened, with crushed green cardamom.'
			}
		]
		answerText = `Ready to pour your usual <strong>Mumbai Cutting Cold Brew</strong> (Almond milk, Unsweetened — <strong>₹260</strong>). Tap <strong>Quick order</strong> below to place it right from your wallet.`
	} else {
		// Generic keyword search
		const matched = state.menuItems.filter(m =>
			m.name.toLowerCase().includes(q) ||
			m.description.toLowerCase().includes(q) ||
			m.sensoryTags.some(t => t.toLowerCase().includes(q))
		)

		recommended = (matched.length > 0 ? matched : state.menuItems.slice(0, 3)).map(item => ({
			...item,
			geminiReason: `Handpicked from our bar menu for "${query}" (~${item.prepTimeMinutes} min prep).`
		}))

		answerText = `Here are our top picks for <strong>"${query}"</strong>. You can customize the milk, sweetness, bread, or spice level on any item.`
	}

	// Render Barista Note Banner & legacy AI Overview Card
	const conciergeTextEl = document.getElementById('concierge-summary-text')
	if (conciergeTextEl) conciergeTextEl.innerHTML = answerText

	const overviewTextEl = document.getElementById('gemini-overview-text')
	if (overviewTextEl) overviewTextEl.innerHTML = answerText

	// Proactive Table Connect Nudge
	const nudgeEl = document.getElementById('overview-table-nudge')
	if (nudgeEl) {
		if (!state.currentUser.isDiscoverable) {
			nudgeEl.classList.remove('hidden')
		} else {
			nudgeEl.classList.add('hidden')
		}
	}

	// Render Recommended Cards & Full Menu
	renderRecommendedGrid(recommended)
	await renderFullMenu('All', '', false)

	// Render People Snippets if relevant
	const peopleSection = document.getElementById('people-snippets-section')
	if (peopleSection) {
		if (showPeople) {
			peopleSection.classList.remove('hidden')
			renderPeopleSnippets()
		} else {
			peopleSection.classList.add('hidden')
		}
	}

	return {
		answer: answerText,
		recommendationsCount: recommended.length,
		showPeople
	}
}

// ============================================================================
// 5. UI Rendering & DOM Synchronization Functions
// ============================================================================

export function setAppMode(mode) {
	state.mode = mode
	document.body.dataset.mode = mode

	const heroSlot = document.getElementById('hero-search-slot')
	const headerSlot = document.getElementById('header-search-slot')
	const searchForm = document.getElementById('omni-search-form')
	const workspace = document.getElementById('workspace')

	if (mode === 'results') {
		if (workspace) workspace.classList.remove('hidden')
		if (headerSlot && searchForm && !headerSlot.contains(searchForm)) {
			headerSlot.appendChild(searchForm)
		}
	} else {
		if (workspace) workspace.classList.add('hidden')
		if (heroSlot && searchForm && !heroSlot.contains(searchForm)) {
			heroSlot.appendChild(searchForm)
		}
	}
}

export async function switchTab(tabName, withShimmerEffect = true) {
	const resolvedTab = tabName === 'overview' ? 'menu' : (tabName === 'connect' ? 'games' : tabName)
	state.activeTab = resolvedTab

	// Update tab button styles
	document.querySelectorAll('.nav-tab').forEach(tab => {
		if (tab.dataset.tab === resolvedTab) {
			tab.classList.add('active')
		} else {
			tab.classList.remove('active')
		}
	})

	const customerGrid = document.getElementById('customer-grid')
	const ownerPortalView = document.getElementById('owner-portal-view')

	if (resolvedTab === 'owner') {
		if (customerGrid) customerGrid.classList.add('hidden')
		if (ownerPortalView) ownerPortalView.classList.remove('hidden')
		renderOwnerPortal()
	} else {
		if (customerGrid) customerGrid.classList.remove('hidden')
		if (ownerPortalView) ownerPortalView.classList.add('hidden')

		document.querySelectorAll('.tab-content').forEach(content => {
			if (content.dataset.view === resolvedTab) {
				content.classList.remove('hidden')
			} else {
				content.classList.add('hidden')
			}
		})

		if (resolvedTab === 'games') {
			await renderGamesGrid(state.gameFilter, withShimmerEffect)
		} else if (resolvedTab === 'cafes') {
			await renderNearbyCafesGrid(withShimmerEffect)
		} else if (resolvedTab === 'menu' && withShimmerEffect) {
			await renderFullMenu('All', '', true)
		}
	}
}

export function switchPersona(personaId) {
	const p = PERSONAS[personaId]
	if (!p) return

	state.activePersona = personaId
	state.currentUser = { ...p }

	// If owner chosen, switch to Owner Tab
	if (personaId === 'vikram') {
		setAppMode('results')
		switchTab('owner', false)
	}

	renderWallet()
	renderSidebarProfile()
	renderHeroOptinCard()
	renderTableConnect()
	renderOrders()

	showToast(`Viewing cafe as ${p.name}`, 'toast-info')
}

// Wallet Rendering
export function renderWallet() {
	const headerWallet = document.getElementById('header-wallet-balance')
	const walletText = document.getElementById('wallet-balance-text')
	const sidebarWallet = document.getElementById('sidebar-wallet-number')

	const formatted = state.currentUser.walletBalance.toLocaleString('en-IN')
	if (headerWallet) headerWallet.textContent = formatted
	if (walletText) walletText.textContent = formatted
	if (sidebarWallet) sidebarWallet.textContent = `₹${formatted}`
}

// Sidebar Profile Card
export function renderSidebarProfile() {
	const nameEl = document.getElementById('sidebar-user-name')
	const handleEl = document.getElementById('sidebar-user-handle')
	const avatarEl = document.getElementById('sidebar-user-avatar')
	const tableEl = document.getElementById('sidebar-table-label')
	const sippingEl = document.getElementById('sidebar-sipping-drink')
	const pillEl = document.getElementById('sidebar-discoverable-pill')

	if (nameEl) nameEl.textContent = state.currentUser.name
	if (handleEl) handleEl.textContent = state.currentUser.handle
	if (avatarEl) avatarEl.textContent = state.currentUser.avatar || '☕'
	if (tableEl) tableEl.textContent = state.currentUser.tableLabel || 'Table 4'
	if (sippingEl) sippingEl.textContent = state.currentUser.currentlySipping || 'Mumbai Cutting Cold Brew'

	if (pillEl) {
		if (state.currentUser.isDiscoverable) {
			pillEl.textContent = 'Open to chat'
			pillEl.className = 'discoverable-pill active'
		} else {
			pillEl.textContent = 'Quiet mode'
			pillEl.className = 'discoverable-pill'
		}
	}
}

// Proactive Hero Opt-In Card
export function renderHeroOptinCard() {
	const card = document.getElementById('hero-table-optin-card')
	if (!card) return

	if (state.currentUser.isDiscoverable) {
		card.classList.add('hidden')
	} else {
		card.classList.remove('hidden')
	}
}

// Recommended Menu Items in Barista Note
function renderRecommendedGrid(items) {
	const grid = document.getElementById('recommended-items-grid')
	const section = document.getElementById('recommendations-section')
	if (!grid) return
	if (section) section.classList.toggle('hidden', !items || items.length === 0)

	grid.innerHTML = items.map(item => `
		<article class="menu-card" data-item-id="${item.id}">
			<div class="menu-card-top">
				<div class="card-category-row">
					<span class="card-category-badge">☕ ${item.category}</span>
					<span class="card-stock-badge ${item.stock < 10 ? 'low-stock' : 'in-stock'}">
						${item.stock > 0 ? `${item.stock} ready` : 'Sold out'}
					</span>
				</div>
				<h3 class="card-item-title">${item.name}</h3>
				<p class="card-item-desc">${item.description}</p>
				${item.geminiReason ? `
					<div class="card-gemini-reason">
						<strong>☕ Barista's note:</strong> ${item.geminiReason}
					</div>
				` : ''}
				<div class="card-sensory-tags">
					${item.sensoryTags.map(t => `<span class="sensory-tag">${t}</span>`).join('')}
				</div>
			</div>
			<div class="menu-card-bottom">
				<div class="card-price-group">
					<span class="card-price">₹${item.price}</span>
					<span class="card-prep-time">~${item.prepTimeMinutes} min prep</span>
				</div>
				<div class="card-actions-group">
					<button class="btn-quick-order" data-quick-order="${item.id}">Quick order • ₹${item.price}</button>
					<button class="btn-customize-order" data-customize-item="${item.id}">Customize &amp; order</button>
				</div>
			</div>
		</article>
	`).join('')
}

// Full 14-Item Menu Grid (With Optional 420ms Shimmer)
export async function renderFullMenu(category = 'All', filterQuery = '', showShimmer = false) {
	const grid = document.getElementById('full-menu-grid')
	if (!grid) return

	if (showShimmer) {
		renderShimmerCards(grid, 4)
		await new Promise(resolve => setTimeout(resolve, 420))
	}

	let filtered = state.menuItems
	if (category && category !== 'All') {
		filtered = filtered.filter(i => i.category === category)
	}
	if (filterQuery) {
		const q = filterQuery.toLowerCase()
		filtered = filtered.filter(i =>
			i.name.toLowerCase().includes(q) ||
			i.description.toLowerCase().includes(q) ||
			i.sensoryTags.some(t => t.toLowerCase().includes(q))
		)
	}

	const categoryIcon = (cat) => {
		if (cat === 'Coffee') return '☕'
		if (cat === 'Tea & Coolers') return '🧊'
		if (cat === 'Burgers & Sandwiches') return '🥐'
		return '🍟'
	}

	grid.innerHTML = filtered.map(item => `
		<article class="menu-card" data-item-id="${item.id}">
			<div class="menu-card-top">
				<div class="card-category-row">
					<span class="card-category-badge">${categoryIcon(item.category)} ${item.category}</span>
					<span class="card-stock-badge ${item.stock === 0 ? 'sold-out' : (item.stock < 10 ? 'low-stock' : 'in-stock')}">
						${item.stock > 0 ? `${item.stock} available` : 'Sold out'}
					</span>
				</div>
				<h3 class="card-item-title">${item.name}</h3>
				<p class="card-item-desc">${item.description}</p>
				<div class="card-sensory-tags">
					${item.sensoryTags.map(t => `<span class="sensory-tag">${t}</span>`).join('')}
				</div>
			</div>
			<div class="menu-card-bottom">
				<div class="card-price-group">
					<span class="card-price">₹${item.price}</span>
					<span class="card-prep-time">~${item.prepTimeMinutes} min prep</span>
				</div>
				<div class="card-actions-group">
					<button class="btn-quick-order" data-quick-order="${item.id}" ${item.stock === 0 ? 'disabled' : ''}>Quick order</button>
					<button class="btn-customize-order" data-customize-item="${item.id}" ${item.stock === 0 ? 'disabled' : ''}>
						${item.stock > 0 ? 'Customize' : 'Out of stock'}
					</button>
				</div>
			</div>
		</article>
	`).join('')
}

// Board Games Lounge & Table Games Pairing Grid (With 420ms Shimmer)
export async function renderGamesGrid(sourceFilter = 'ALL', showShimmer = true) {
	state.gameFilter = sourceFilter
	const grid = document.getElementById('games-cards-grid')
	if (!grid) return

	if (showShimmer) {
		renderShimmerCards(grid, 4)
		try {
			const [res] = await Promise.all([
				fetch('/api/games').then(r => (r.ok ? r.json() : null)).catch(() => null),
				new Promise(resolve => setTimeout(resolve, 420))
			])
			if (res && Array.isArray(res.games) && res.games.length > 0) {
				state.tableGames = res.games
			}
		} catch {
			// Use local state fallback
		}
	}

	let games = [...state.tableGames]
	if (sourceFilter && sourceFilter !== 'ALL') {
		games = games.filter(g => g.source === sourceFilter)
	}

	grid.innerHTML = games.map(g => {
		const isShelf = g.source === 'CAFE_SHELF'
		const openSeats = Math.max(0, g.maxPlayers - g.currentPlayers)
		return `
			<article class="game-card" data-game-id="${g.id}">
				<div>
					<div class="game-card-header">
						<span class="game-source-badge ${isShelf ? 'shelf' : 'guest'}">
							${isShelf ? '☕ On cafe shelf' : '🎒 Brought by guest'}
						</span>
						<span class="game-seats-pill">
							${g.lookingForPlayers && openSeats > 0 ? `${openSeats} seat${openSeats === 1 ? '' : 's'} open` : 'On shelf / Full'}
						</span>
					</div>
					<h3 class="game-title">🎲 ${g.title}</h3>
					<p class="game-meta-line">
						${g.category} • ${g.tableNumber ? `Table ${g.tableNumber}` : 'Shelf copy'}
						${g.hostName ? ` • Hosted by ${g.hostName}` : ''}
					</p>
				</div>
				<p class="game-note">${g.note || 'Open for a friendly game over coffee!'}</p>
				<div class="game-card-footer">
					<span style="font-size:0.82rem;font-weight:600;color:var(--color-text-secondary)">
						👥 ${g.currentPlayers}/${g.maxPlayers} players
					</span>
					${g.lookingForPlayers && openSeats > 0 ? `
						<button class="btn-primary btn-sm" data-join-game="${g.id}">
							Join at Table ${g.tableNumber || 4}
						</button>
					` : `
						<button class="btn-secondary btn-sm" data-grab-shelf-game="${g.title}">
							Host at my table
						</button>
					`}
				</div>
			</article>
		`
	}).join('')
}

// Nearby Cafes Finder Grid (With 420ms Shimmer)
export async function renderNearbyCafesGrid(showShimmer = true) {
	const grid = document.getElementById('nearby-cafes-grid')
	const summaryBar = document.getElementById('nearby-summary-bar')
	if (!grid) return

	const search = document.getElementById('nearby-search-input')?.value?.trim() || ''
	const game = document.getElementById('filter-cafe-game')?.value || ''
	const craving = document.getElementById('filter-cafe-craving')?.value || ''
	const chatOnly = document.getElementById('filter-cafe-chat-only')?.checked || false

	if (showShimmer) {
		renderShimmerCards(grid, 3)
		const params = new URLSearchParams()
		if (search) params.set('search', search)
		if (game) params.set('game', game)
		if (craving) params.set('craving', craving)
		if (chatOnly) params.set('minChatPartners', '4')

		try {
			const [res] = await Promise.all([
				fetch(`/api/cafes/nearby?${params.toString()}`).then(r => (r.ok ? r.json() : null)).catch(() => null),
				new Promise(resolve => setTimeout(resolve, 420))
			])
			if (res && Array.isArray(res.cafes) && res.cafes.length > 0 && !search && !game && !craving && !chatOnly) {
				state.nearbyCafes = res.cafes
			}
		} catch {
			// Fallback to local state
		}
	}

	const filteredResult = await executeToolAction('find_nearby_cafes', {
		search: search || undefined,
		game: game || undefined,
		craving: craving || undefined,
		minChatPartners: chatOnly ? 4 : undefined
	})
	const cafes = filteredResult.cafes || []

	if (summaryBar) {
		summaryBar.innerHTML = `<span>${filteredResult.summary}</span>`
	}

	if (cafes.length === 0) {
		grid.innerHTML = `
			<article class="knowledge-card" style="grid-column: 1 / -1; padding: 24px; text-align: center;">
				<h3>No cafes match all those filters right now</h3>
				<p style="color: var(--color-text-secondary); margin-top: 6px;">Try clearing the board game or craving filter to see all 5 nearby Mumbai locations.</p>
			</article>
		`
		return
	}

	grid.innerHTML = cafes.map(c => `
		<article class="nearby-cafe-card" data-cafe-id="${c.id}">
			<div>
				<div class="nearby-cafe-top">
					<div>
						<h3 class="nearby-cafe-name">☕ ${c.name}</h3>
						<p class="nearby-cafe-hood">📍 ${c.neighborhood} • ${c.address}</p>
					</div>
					<span class="distance-pill">
						${Number(c.distanceKm) === 0 ? 'Here now' : `${c.distanceKm} km • ~${c.walkOrDriveMins}m`}
					</span>
				</div>

				<p style="font-size: 0.88rem; color: var(--color-text-primary); margin: 12px 0;">
					${c.featuredBlurb}
				</p>

				<div class="nearby-stats-row">
					<span class="nearby-stat-chip">⏳ ~${c.waitMins}m bar wait</span>
					<span class="nearby-stat-chip">👋 ${c.openToChatCount} open to chat</span>
					<span class="nearby-stat-chip">🎲 ${c.activeGameTables} game tables</span>
				</div>
			</div>

			<div class="nearby-tags-group">
				<span class="nearby-tags-label">🎲 Games on shelf &amp; tables</span>
				<div class="nearby-tags-row">
					${(c.availableGames || []).map(g => `<span class="sensory-tag">${g}</span>`).join('')}
				</div>
			</div>

			<div class="nearby-tags-group">
				<span class="nearby-tags-label">🥐 Popular drinks &amp; food</span>
				<div class="nearby-tags-row">
					${(c.signatureItems || []).map(s => `<span class="sensory-tag">${s}</span>`).join('')}
				</div>
			</div>
		</article>
	`).join('')
}

// Table Connect People Grid & Control Bar
export function renderTableConnect() {
	const dot = document.getElementById('connect-status-dot')
	const label = document.getElementById('connect-status-label')
	const toggle = document.getElementById('connect-discoverable-toggle')
	const tableInput = document.getElementById('connect-table-input')
	const blurbInput = document.getElementById('connect-blurb-input')

	if (toggle) toggle.checked = state.currentUser.isDiscoverable
	if (dot) {
		dot.className = state.currentUser.isDiscoverable ? 'status-indicator-dot' : 'status-indicator-dot hidden-dot'
	}
	if (label) {
		label.textContent = state.currentUser.isDiscoverable ? 'You are currently discoverable' : 'You are currently hidden'
	}
	if (tableInput) tableInput.value = state.currentUser.tableLabel || 'Table 4'
	if (blurbInput) blurbInput.value = state.currentUser.statusBlurb || ''

	// Render other discoverable people
	const grid = document.getElementById('people-cards-grid')
	if (!grid) return

	const otherPeople = Object.values(PERSONAS).filter(p => p.isDiscoverable && p.id !== state.currentUser.id)

	grid.innerHTML = otherPeople.map(p => `
		<article class="person-card" data-person-id="${p.id}">
			<div class="person-card-top">
				<div class="person-header">
					<div class="person-meta">
						<span class="person-avatar">${p.avatar}</span>
						<div>
							<h3 class="person-name">${p.name}</h3>
							<span class="person-handle">${p.handle}</span>
						</div>
					</div>
					<span class="table-badge">${p.tableLabel}</span>
				</div>

				<div class="sipping-badge">
					<span>☕ Currently sipping:</span>
					<strong>${p.currentlySipping}</strong>
				</div>

				<p class="person-blurb">"${p.statusBlurb}"</p>

				${p.icebreaker ? `
					<div class="icebreaker-box">
						<span class="icebreaker-label">💬 Conversation starter</span>
						${p.icebreaker}
					</div>
				` : ''}
			</div>

			<button class="btn-send-wave" data-wave-to="${p.id}" data-wave-name="${p.name}">
				<span>👋</span> Send wave to ${p.tableLabel}
			</button>
		</article>
	`).join('')
}

// People Snippets in AI Overview
function renderPeopleSnippets() {
	const grid = document.getElementById('people-snippets-grid')
	if (!grid) return

	const otherPeople = Object.values(PERSONAS).filter(p => p.isDiscoverable && p.id !== state.currentUser.id)

	grid.innerHTML = otherPeople.map(p => `
		<article class="person-card" data-person-id="${p.id}">
			<div class="person-card-top">
				<div class="person-header">
					<div class="person-meta">
						<span class="person-avatar">${p.avatar}</span>
						<div>
							<h3 class="person-name">${p.name}</h3>
							<span class="person-handle">${p.handle}</span>
						</div>
					</div>
					<span class="table-badge">${p.tableLabel}</span>
				</div>
				<p class="person-blurb">"${p.statusBlurb}"</p>
			</div>
			<button class="btn-send-wave" data-wave-to="${p.id}" data-wave-name="${p.name}">
				<span>👋</span> Send wave to ${p.tableLabel}
			</button>
		</article>
	`).join('')
}

// Active Order & Order History
export function renderOrders() {
	const userActive = state.orders.find(o => o.userId === state.currentUser.id && o.status !== 'Completed')
	const trackerCard = document.getElementById('active-order-tracker-card')

	if (trackerCard) {
		if (userActive) {
			trackerCard.classList.remove('hidden')
			const idEl = document.getElementById('tracker-order-id')
			const channelEl = document.getElementById('tracker-channel-badge')
			const waitEl = document.getElementById('tracker-wait-text')
			const tableEl = document.getElementById('tracker-table-text')
			const itemsList = document.getElementById('tracker-items-list')

			if (idEl) idEl.textContent = `Order #${userActive.id}`
			if (channelEl) {
				channelEl.textContent = userActive.orderedVia === 'webmcp_agent'
					? '🤖 Ordered via WebMCP Agent'
					: (userActive.orderedVia === 'mcp_server' ? '🔌 Ordered via MCP Server' : '👤 Ordered via Web UI')
			}
			if (waitEl) waitEl.textContent = `⏳ Estimated prep time: ~${userActive.waitMinutes} minutes`
			if (tableEl) tableEl.textContent = `Delivering to: ${userActive.tableLabel}`

			// Progress Steps
			const steps = ['Pending', 'Preparing', 'Ready', 'Completed']
			const currIdx = steps.indexOf(userActive.status)

			steps.forEach((step, idx) => {
				const stepEl = document.getElementById(`step-${step.toLowerCase()}`)
				const lineEl = document.getElementById(`line-${idx}`)
				if (stepEl) {
					stepEl.className = 'progress-step'
					if (idx < currIdx) stepEl.classList.add('completed')
					else if (idx === currIdx) stepEl.classList.add('active')
				}
				if (lineEl) {
					lineEl.className = idx < currIdx ? 'progress-line completed' : 'progress-line'
				}
			})

			if (itemsList) {
				itemsList.innerHTML = userActive.items.map(it => `
					<div class="tracker-item-row">
						<div>
							<span class="tracker-item-title">${it.quantity}x ${it.itemName}</span>
							<div class="tracker-item-customizations">
								${Object.entries(it.customizations || {}).map(([k, v]) => `${k}: ${v}`).join(' • ')}
							</div>
						</div>
						<strong>₹${it.price}</strong>
					</div>
				`).join('')
			}
		} else {
			trackerCard.classList.add('hidden')
		}
	}

	// Render My Usuals
	const usualsGrid = document.getElementById('usuals-grid')
	if (usualsGrid) {
		const usual = state.currentUser.usualOrder
		if (usual) {
			usualsGrid.innerHTML = `
				<div class="usual-card">
					<h3 class="usual-title">${usual.itemName}</h3>
					<p class="usual-customizations">${Object.entries(usual.customizations).map(([k, v]) => `${k}: ${v}`).join(', ')}</p>
					<div class="usual-bottom">
						<strong>₹${usual.price}</strong>
						<button class="btn-primary btn-sm" id="btn-reorder-usual">Reorder with customizations</button>
					</div>
				</div>
			`
		}
	}

	// Render Past Orders Timeline
	const historyList = document.getElementById('order-history-list')
	if (historyList) {
		historyList.innerHTML = state.pastOrders.map(o => `
			<div class="history-card">
				<div class="history-meta">
					<span class="history-order-id">Order #${o.id} • ${o.items}</span>
					<span class="history-date">${o.date} • ${o.orderedVia === 'webmcp_agent' ? '🤖 WebMCP' : '👤 Web'}</span>
				</div>
				<div>
					<strong>₹${o.total}</strong>
					<span class="card-stock-badge in-stock" style="margin-left: 8px;">${o.status}</span>
				</div>
			</div>
		`).join('')
	}
}

// Incoming Waves in Sidebar
export function renderIncomingWaves() {
	const list = document.getElementById('sidebar-waves-list')
	const count = document.getElementById('sidebar-wave-count')

	if (count) count.textContent = `${state.incomingWaves.length} wave${state.incomingWaves.length === 1 ? '' : 's'}`

	if (list) {
		if (state.incomingWaves.length === 0) {
			list.innerHTML = `<p style="font-size:0.8rem;color:var(--color-text-muted)">No incoming table waves yet. Opt in to Table Connect so guests can say hi!</p>`
		} else {
			list.innerHTML = state.incomingWaves.map(w => `
				<div class="wave-item">
					<div class="wave-header">
						<span class="wave-sender">👋 ${w.fromName} (${w.fromTable})</span>
						<span class="wave-time">${w.time}</span>
					</div>
					<p class="wave-message">"${w.message}"</p>
				</div>
			`).join('')
		}
	}
}

// Room Vibes Feed
export function renderRoomVibes() {
	const feed = document.getElementById('vibes-feed-list')
	if (!feed) return

	feed.innerHTML = state.roomVibes.map(v => `
		<div class="vibe-feed-item">
			<div class="vibe-item-header">
				<span class="vibe-item-sentiment">☕ ${v.sentiment}</span>
				<span class="vibe-item-time">${v.time}</span>
			</div>
			<p class="vibe-item-comment">"${v.comment}"</p>
		</div>
	`).join('')
}

// Owner Portal & Barista Kitchen Queue (KOT)
export function renderOwnerPortal() {
	renderKitchenQueue()
	renderInventoryTable()
}

export function renderKitchenQueue() {
	const lanes = {
		pending: document.getElementById('lane-pending-list'),
		preparing: document.getElementById('lane-preparing-list'),
		ready: document.getElementById('lane-ready-list')
	}

	const counts = {
		pending: document.getElementById('count-pending'),
		preparing: document.getElementById('count-preparing'),
		ready: document.getElementById('count-ready')
	}

	const grouped = {
		Pending: state.orders.filter(o => o.status === 'Pending'),
		Preparing: state.orders.filter(o => o.status === 'Preparing'),
		Ready: state.orders.filter(o => o.status === 'Ready')
	}

	if (counts.pending) counts.pending.textContent = String(grouped.Pending.length)
	if (counts.preparing) counts.preparing.textContent = String(grouped.Preparing.length)
	if (counts.ready) counts.ready.textContent = String(grouped.Ready.length)

	const activeTotal = grouped.Pending.length + grouped.Preparing.length + grouped.Ready.length
	const totalTag = document.getElementById('kot-active-count')
	if (totalTag) totalTag.textContent = `${activeTotal} active orders`

	const pulseEl = document.getElementById('header-pulse-text')
	if (pulseEl) pulseEl.textContent = `Quiet • ~4 min wait • ${activeTotal} in queue`

	for (const [status, ordersList] of Object.entries(grouped)) {
		const laneEl = lanes[status.toLowerCase()]
		if (!laneEl) continue

		laneEl.innerHTML = ordersList.map(order => {
			let nextStatusBtn = ''
			if (order.status === 'Pending') {
				nextStatusBtn = `<button class="btn-advance-status" data-advance-id="${order.id}" data-next-status="Preparing">Start preparing ➔</button>`
			} else if (order.status === 'Preparing') {
				nextStatusBtn = `<button class="btn-advance-status" data-advance-id="${order.id}" data-next-status="Ready">Mark ready for pickup ➔</button>`
			} else if (order.status === 'Ready') {
				nextStatusBtn = `<button class="btn-advance-status" data-advance-id="${order.id}" data-next-status="Completed">Complete order ✓</button>`
			}

			return `
				<div class="kot-ticket" data-order-id="${order.id}">
					<div class="kot-ticket-header">
						<span class="kot-ticket-id">#${order.id}</span>
						<span class="channel-tag ${order.orderedVia !== 'web_ui' ? 'agent' : ''}">
							${order.orderedVia === 'webmcp_agent' ? '🤖 WebMCP' : (order.orderedVia === 'mcp_server' ? '🔌 MCP' : '👤 Web')}
						</span>
					</div>

					<div class="kot-customer-meta">
						<strong>${order.customerName}</strong>
						<span>${order.tableLabel} • ${order.placedAt}</span>
					</div>

					<div class="kot-items-detail">
						${order.items.map(it => `
							<div>
								<strong>${it.quantity}x ${it.itemName}</strong>
								${Object.entries(it.customizations || {}).map(([k, v]) => `
									<div class="kot-customization-note">• ${k}: ${v}</div>
								`).join('')}
							</div>
						`).join('')}
					</div>

					<div class="kot-ticket-actions">
						${nextStatusBtn}
					</div>
				</div>
			`
		}).join('')
	}
}

// Live Inventory & Stock Table
export function renderInventoryTable() {
	const tbody = document.getElementById('inventory-table-body')
	if (!tbody) return

	tbody.innerHTML = state.menuItems.map(item => `
		<tr data-inventory-id="${item.id}">
			<td>
				<span class="table-item-name">${item.name}</span>
			</td>
			<td>${item.category}</td>
			<td>₹${item.price}</td>
			<td>
				<span class="table-stock-number ${item.stock === 0 ? 'out' : (item.stock < 10 ? 'low' : '')}">
					${item.stock}
				</span>
			</td>
			<td>
				<span class="card-stock-badge ${item.stock === 0 ? 'sold-out' : (item.stock < 10 ? 'low-stock' : 'in-stock')}">
					${item.stock > 0 ? 'In stock' : 'Sold out'}
				</span>
			</td>
			<td>
				<div class="inventory-actions-group">
					<button class="btn-stock-adjust" data-restock-id="${item.id}" data-delta="10">+10 Restock</button>
					<button class="btn-stock-adjust" data-restock-id="${item.id}" data-delta="-5" ${item.stock === 0 ? 'disabled' : ''}>-5</button>
				</div>
			</td>
		</tr>
	`).join('')
}

// WebMCP Inspector Drawer Catalogue & Invoker
function renderWebMcpDrawerCatalogue() {
	const select = document.getElementById('webmcp-tool-select')
	const accordion = document.getElementById('tools-accordion')
	const tools = webMcpManager.listTools()

	if (select) {
		select.innerHTML = tools.map(t => `<option value="${t.name}">${t.name} (${t.method.toUpperCase()})</option>`).join('')
		select.addEventListener('change', () => updateToolArgsTemplate(select.value))
		updateToolArgsTemplate(select.value)
	}

	if (accordion) {
		accordion.innerHTML = tools.map(t => `
			<div class="tool-item">
				<button type="button" class="tool-header-btn" data-tool-toggle="${t.name}">
					<span>${t.name}</span>
					<span style="font-size:0.75rem;color:var(--color-text-muted)">${t.method.toUpperCase()} ${t.path}</span>
				</button>
				<div class="tool-details hidden" id="details-${t.name}">
					<p>${t.description}</p>
					<pre style="margin-top:6px;font-size:0.72rem;color:var(--color-accent-blue)">${JSON.stringify(t.inputSchema.properties, null, 2)}</pre>
				</div>
			</div>
		`).join('')
	}
}

function updateToolArgsTemplate(toolName) {
	const argsText = document.getElementById('webmcp-tool-args')
	if (!argsText) return

	const templates = {
		omni_search_cafe: { query: 'Sleepy & rainy Mumbai afternoon — low-acid coffee + spicy snack', userId: 'syed' },
		list_menu_items: { category: 'Coffee', onlyAvailable: true },
		get_viewer_context: { userId: 'syed' },
		place_order: {
			userId: 'syed',
			orderedVia: 'webmcp_agent',
			tableLabel: 'Table 4',
			items: [{ menuItemId: 1, quantity: 1, customizations: { 'Milk Choice': 'Oat Milk' } }]
		},
		top_up_wallet: { userId: 'syed', amount: 2000 },
		discover_table_connect: { viewerId: 'syed' },
		update_table_connect: { userId: 'syed', isDiscoverable: true, tableLabel: 'Table 4', statusBlurb: 'Working on WebMCP agent' },
		send_table_wave: { fromUserId: 'syed', toUserId: 'ananya', message: 'Hello from Table 4!' },
		submit_room_vibe: { userId: 'syed', sentiment: 'Productive', comment: 'Great atmosphere' },
		get_owner_dashboard: {},
		advance_order_status: { orderId: 102, status: 'Preparing' },
		update_menu_stock: { itemId: 1, stockDelta: 10 },
		ask_owner_analytics: { question: 'Which burger or coffee sells best?' }
	}

	argsText.value = JSON.stringify(templates[toolName] || {}, null, 2)
}

// Customizer Dialog Management
export function openCustomizerDialog(menuItemId) {
	const item = state.menuItems.find(m => m.id === Number(menuItemId))
	if (!item) return

	state.customizerTargetItem = item
	state.customizerQuantity = 1
	state.customizerSelections = {}

	// Set defaults
	for (const group of item.customizations) {
		state.customizerSelections[group.name] = group.options[0].name
	}

	const dialog = document.getElementById('customizer-dialog')
	const titleEl = document.getElementById('customizer-item-title')
	const categoryEl = document.getElementById('customizer-category-badge')
	const priceEl = document.getElementById('customizer-base-price')
	const qtyEl = document.getElementById('customizer-qty')
	const container = document.getElementById('customizer-groups-container')

	if (titleEl) titleEl.textContent = item.name
	if (categoryEl) categoryEl.textContent = item.category
	if (priceEl) priceEl.textContent = `Base price: ₹${item.price}`
	if (qtyEl) qtyEl.textContent = '1'

	if (container) {
		container.innerHTML = item.customizations.map(group => `
			<div class="customizer-group" data-group-name="${group.name}">
				<span class="group-title">${group.name}</span>
				<div class="group-options-chips">
					${group.options.map((opt, idx) => `
						<label class="customizer-option-chip">
							<input
								type="radio"
								name="customizer-${group.name}"
								value="${opt.name}"
								${idx === 0 ? 'checked' : ''}
								data-extra-price="${opt.extraPrice}"
							>
							<span>
								${opt.name}
								${opt.extraPrice > 0 ? `<em class="option-extra-price">+₹${opt.extraPrice}</em>` : ''}
							</span>
						</label>
					`).join('')}
				</div>
			</div>
		`).join('')
	}

	updateCustomizerTotalButton()

	if (dialog && typeof dialog.showModal === 'function') {
		dialog.showModal()
	}
}

function updateCustomizerTotalButton() {
	if (!state.customizerTargetItem) return
	let total = state.customizerTargetItem.price

	const checkedInputs = document.querySelectorAll('#customizer-groups-container input[type="radio"]:checked')
	checkedInputs.forEach(input => {
		total += Number(input.dataset.extraPrice || 0)
	})

	const finalPrice = total * state.customizerQuantity
	const btn = document.getElementById('btn-submit-order')
	if (btn) {
		btn.textContent = `Place order • ₹${finalPrice}`
	}
}

// Toast System
export function showToast(message, type = 'toast-info') {
	const container = document.getElementById('toast-container')
	if (!container) return

	const toast = document.createElement('div')
	toast.className = `toast ${type}`
	toast.textContent = message

	container.appendChild(toast)

	setTimeout(() => {
		toast.style.opacity = '0'
		toast.style.transform = 'translateY(8px)'
		toast.style.transition = 'all 0.2s ease'
		setTimeout(() => toast.remove(), 200)
	}, 3500)
}

// ============================================================================
// 6. Real-Time Server-Sent Events (SSE) Listener (/api/events)
// ============================================================================

function connectEventSource() {
	try {
		const es = new EventSource('/api/events')

		es.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data)
				handleServerMutationEvent(data)
			} catch {
				// Ignore non-json heartbeats
			}
		}

		es.onerror = () => {
			es.close()
			setTimeout(connectEventSource, 8000)
		}
	} catch (err) {
		console.warn('SSE connection unavailable in static mode; using simulated polling.', err)
	}
}

function handleServerMutationEvent(event) {
	if (event.type === 'order_status_change') {
		const order = state.orders.find(o => o.id === event.orderId)
		if (order) {
			order.status = event.status
			renderOrders()
			renderKitchenQueue()
			showToast(`Order #${event.orderId} updated to ${event.status}!`, 'toast-info')
		}
	} else if (event.type === 'table_wave') {
		state.incomingWaves.unshift(event.wave)
		renderIncomingWaves()
		showToast(`Wave from ${event.wave.fromName}!`, 'toast-wave')
	} else if (event.type === 'stock_update') {
		const item = state.menuItems.find(m => m.id === event.itemId)
		if (item) {
			item.stock = event.stock
			renderFullMenu()
			renderInventoryTable()
		}
	}
}

// ============================================================================
// 7. Event Handlers & User Interactions
// ============================================================================

function setupEventListeners() {
	// Brand Home Link
	document.getElementById('btn-brand-home')?.addEventListener('click', () => {
		setAppMode('home')
	})

	// Persona Selector
	document.getElementById('persona-select')?.addEventListener('change', (e) => {
		switchPersona(e.target.value)
	})

	// Header Discoverable Badge
	document.getElementById('btn-header-connect')?.addEventListener('click', () => {
		setAppMode('results')
		switchTab('connect')
	})

	// 1-Click Top-Up Wallet Buttons
	document.getElementById('btn-topup-wallet')?.addEventListener('click', () => {
		webMcpManager.callTool('top_up_wallet', { userId: state.currentUser.id, amount: 2000 })
	})
	document.getElementById('btn-sidebar-topup')?.addEventListener('click', () => {
		webMcpManager.callTool('top_up_wallet', { userId: state.currentUser.id, amount: 2000 })
	})

	// WebMCP Drawer Toggle & Close
	document.getElementById('btn-toggle-webmcp')?.addEventListener('click', () => {
		document.getElementById('webmcp-drawer')?.classList.toggle('hidden')
	})
	document.getElementById('btn-close-drawer')?.addEventListener('click', () => {
		document.getElementById('webmcp-drawer')?.classList.add('hidden')
	})

	// Omni-Search Form Submission
	document.getElementById('omni-search-form')?.addEventListener('submit', (e) => {
		e.preventDefault()
		const input = document.getElementById('omni-search-input')
		if (input?.value.trim()) {
			webMcpManager.callTool('omni_search_cafe', { query: input.value.trim(), userId: state.currentUser.id })
		}
	})

	// Voice / Sample Inquiry Trigger
	document.getElementById('btn-voice-prompt')?.addEventListener('click', () => {
		const input = document.getElementById('omni-search-input')
		if (input) {
			input.value = 'Sleepy & rainy Mumbai afternoon — low-acid coffee + spicy snack'
			webMcpManager.callTool('omni_search_cafe', { query: input.value, userId: state.currentUser.id })
		}
	})

	// Quick Action Chips (Search queries + direct tab triggers for Games, Chat, and Nearby Cafes)
	document.getElementById('quick-chips-wrapper')?.addEventListener('click', (e) => {
		const chip = e.target.closest('.quick-chip')
		if (!chip) return
		const action = chip.dataset.action
		if (action === 'tab-games' || action === 'tab-connect') {
			setAppMode('results')
			switchTab('games', true)
			return
		}
		if (action === 'tab-cafes') {
			setAppMode('results')
			switchTab('cafes', true)
			return
		}
		if (chip.dataset.query) {
			webMcpManager.callTool('omni_search_cafe', { query: chip.dataset.query, userId: state.currentUser.id })
		}
	})

	// Barista Portal Button & Dialog
	document.getElementById('barista-mode-btn')?.addEventListener('click', () => {
		setAppMode('results')
		switchTab('owner', false)
	})
	document.getElementById('btn-close-barista-dialog')?.addEventListener('click', () => {
		document.getElementById('barista-dialog')?.close()
	})
	document.getElementById('btn-enter-barista-portal')?.addEventListener('click', () => {
		document.getElementById('barista-dialog')?.close()
		setAppMode('results')
		switchTab('owner', false)
	})

	// Top-Up Dialog Support
	document.getElementById('btn-close-topup')?.addEventListener('click', () => {
		document.getElementById('topup-dialog')?.close()
	})
	document.querySelectorAll('.btn-preset-topup').forEach(btn => {
		btn.addEventListener('click', () => {
			document.querySelectorAll('.btn-preset-topup').forEach(b => b.classList.remove('active'))
			btn.classList.add('active')
			const input = document.getElementById('topup-custom-amount')
			if (input) input.value = btn.dataset.amount || '2000'
		})
	})
	document.getElementById('topup-form')?.addEventListener('submit', (e) => {
		e.preventDefault()
		const amount = Number(document.getElementById('topup-custom-amount')?.value) || 2000
		webMcpManager.callTool('top_up_wallet', { userId: state.currentUser.id, amount })
		document.getElementById('topup-dialog')?.close()
	})

	// Games Filter Pills (All games / On the cafe shelf / Brought by guests)
	document.getElementById('games-filter-pills')?.addEventListener('click', (e) => {
		const pill = e.target.closest('.filter-pill')
		if (!pill) return
		document.querySelectorAll('#games-filter-pills .filter-pill').forEach(p => p.classList.remove('active'))
		pill.classList.add('active')
		renderGamesGrid(pill.dataset.gameFilter || 'ALL', true)
	})

	// Host or Share a Game Modal
	document.getElementById('btn-open-host-game')?.addEventListener('click', () => {
		const dialog = document.getElementById('game-dialog')
		if (dialog && typeof dialog.showModal === 'function') dialog.showModal()
	})
	document.getElementById('btn-close-game-dialog')?.addEventListener('click', () => {
		document.getElementById('game-dialog')?.close()
	})
	document.getElementById('game-form')?.addEventListener('submit', (e) => {
		e.preventDefault()
		const source = document.getElementById('game-source-select')?.value || 'GUEST_BROUGHT'
		const title = document.getElementById('game-title-input')?.value || 'Catan'
		const category = document.getElementById('game-category-select')?.value || 'Strategy'
		const tableRaw = document.getElementById('game-table-input')?.value || '4'
		const maxPlayers = Number(document.getElementById('game-players-input')?.value) || 4
		const note = document.getElementById('game-note-input')?.value || 'Beginners welcome — starting soon over coffee!'

		webMcpManager.callTool('create_or_join_game', {
			action: 'HOST',
			userId: state.currentUser.id,
			source,
			title,
			category,
			tableNumber: Number(String(tableRaw).replace(/\D/g, '')) || 4,
			maxPlayers,
			note
		})
		document.getElementById('game-dialog')?.close()
	})

	// Join Game or Grab Shelf Game Buttons
	document.addEventListener('click', (e) => {
		const joinBtn = e.target.closest('[data-join-game]')
		if (joinBtn) {
			webMcpManager.callTool('create_or_join_game', {
				action: 'JOIN',
				gameId: joinBtn.dataset.joinGame,
				userId: state.currentUser.id
			})
			return
		}
		const grabBtn = e.target.closest('[data-grab-shelf-game]')
		if (grabBtn) {
			const titleInput = document.getElementById('game-title-input')
			const sourceSelect = document.getElementById('game-source-select')
			if (titleInput) titleInput.value = grabBtn.dataset.grabShelfGame || 'Splendor'
			if (sourceSelect) sourceSelect.value = 'CAFE_SHELF'
			const dialog = document.getElementById('game-dialog')
			if (dialog && typeof dialog.showModal === 'function') dialog.showModal()
		}
	})

	// Nearby Cafes Filter Controls
	document.getElementById('nearby-search-input')?.addEventListener('input', () => {
		renderNearbyCafesGrid(false)
	})
	document.getElementById('filter-cafe-game')?.addEventListener('change', () => {
		renderNearbyCafesGrid(true)
	})
	document.getElementById('filter-cafe-craving')?.addEventListener('change', () => {
		renderNearbyCafesGrid(true)
	})
	document.getElementById('filter-cafe-chat-only')?.addEventListener('change', () => {
		renderNearbyCafesGrid(true)
	})

	// Hero Table Connect Opt-In Form
	document.getElementById('hero-optin-form')?.addEventListener('submit', (e) => {
		e.preventDefault()
		const table = document.getElementById('hero-table-input')?.value || 'Table 4'
		const blurb = document.getElementById('hero-blurb-input')?.value || 'Hanging out at BrewMesh!'
		webMcpManager.callTool('update_table_connect', {
			userId: state.currentUser.id,
			isDiscoverable: true,
			tableLabel: table,
			statusBlurb: blurb
		})
	})

	// Navigation Tabs
	document.getElementById('results-nav')?.addEventListener('click', (e) => {
		const tabBtn = e.target.closest('.nav-tab')
		if (tabBtn?.dataset.tab) {
			switchTab(tabBtn.dataset.tab)
		}
	})

	// Overview Table Connect Nudge Button
	document.getElementById('btn-overview-nudge')?.addEventListener('click', () => {
		switchTab('connect')
	})

	// Menu Category Filter Pills (with 420ms shimmer)
	document.querySelector('.category-pills')?.addEventListener('click', (e) => {
		const pill = e.target.closest('.category-pill')
		if (pill) {
			document.querySelectorAll('.category-pill').forEach(p => p.classList.remove('active'))
			pill.classList.add('active')
			const input = document.getElementById('menu-filter-input')
			renderFullMenu(pill.dataset.category, input?.value, true)
		}
	})

	// Menu Text Filter
	document.getElementById('menu-filter-input')?.addEventListener('input', (e) => {
		const activeCat = document.querySelector('.category-pill.active')?.dataset.category || 'All'
		renderFullMenu(activeCat, e.target.value)
	})

	// Table Connect Control Settings Form
	document.getElementById('connect-discoverable-toggle')?.addEventListener('change', (e) => {
		webMcpManager.callTool('update_table_connect', {
			userId: state.currentUser.id,
			isDiscoverable: e.target.checked,
			tableLabel: document.getElementById('connect-table-input')?.value || 'Table 4',
			statusBlurb: document.getElementById('connect-blurb-input')?.value || ''
		})
	})

	document.getElementById('connect-settings-form')?.addEventListener('submit', (e) => {
		e.preventDefault()
		webMcpManager.callTool('update_table_connect', {
			userId: state.currentUser.id,
			isDiscoverable: document.getElementById('connect-discoverable-toggle')?.checked,
			tableLabel: document.getElementById('connect-table-input')?.value || 'Table 4',
			statusBlurb: document.getElementById('connect-blurb-input')?.value || ''
		})
	})

	// Send Wave Buttons in Table Connect
	document.addEventListener('click', (e) => {
		const waveBtn = e.target.closest('[data-wave-to]')
		if (waveBtn) {
			const toId = waveBtn.dataset.waveTo
			const toName = waveBtn.dataset.waveName
			webMcpManager.callTool('send_table_wave', {
				fromUserId: state.currentUser.id,
				toUserId: toId,
				message: `Hi ${toName}! Friendly wave from ${state.currentUser.name} at ${state.currentUser.tableLabel}.`
			})
		}
	})

	// Reorder Usual Button
	document.addEventListener('click', (e) => {
		if (e.target.id === 'btn-reorder-usual') {
			const usual = state.currentUser.usualOrder
			if (usual) {
				webMcpManager.callTool('place_order', {
					userId: state.currentUser.id,
					orderedVia: 'web_ui',
					tableLabel: state.currentUser.tableLabel,
					items: [{ menuItemId: usual.menuItemId, quantity: 1, customizations: usual.customizations }]
				})
			}
		}
	})

	// Room Vibe Form Submission
	document.getElementById('vibe-form')?.addEventListener('submit', (e) => {
		e.preventDefault()
		const sentiment = document.querySelector('input[name="vibe-sentiment"]:checked')?.value || 'Amazing'
		const comment = document.getElementById('vibe-comment-input')?.value || ''
		webMcpManager.callTool('submit_room_vibe', {
			userId: state.currentUser.id,
			sentiment,
			comment
		})
		const commentInput = document.getElementById('vibe-comment-input')
		if (commentInput) commentInput.value = ''
	})

	// Owner KOT Status Advance Buttons
	document.addEventListener('click', (e) => {
		const advanceBtn = e.target.closest('[data-advance-id]')
		if (advanceBtn) {
			const orderId = advanceBtn.dataset.advanceId
			const nextStatus = advanceBtn.dataset.nextStatus
			webMcpManager.callTool('advance_order_status', { orderId: Number(orderId), status: nextStatus })
		}
	})

	// Owner Inventory Restock Buttons
	document.addEventListener('click', (e) => {
		const restockBtn = e.target.closest('[data-restock-id]')
		if (restockBtn) {
			const itemId = restockBtn.dataset.restockId
			const delta = Number(restockBtn.dataset.delta)
			webMcpManager.callTool('update_menu_stock', { itemId: Number(itemId), stockDelta: delta })
		}
	})

	// Owner AI Query Form
	document.getElementById('owner-ai-query-form')?.addEventListener('submit', async (e) => {
		e.preventDefault()
		const input = document.getElementById('owner-ai-query-input')
		const responseEl = document.getElementById('owner-query-response')
		if (input && responseEl) {
			responseEl.classList.remove('hidden')
			responseEl.innerHTML = '<em>☕ Checking today’s cafe orders and room feedback...</em>'
			const res = await webMcpManager.callTool('ask_owner_analytics', { question: input.value })
			responseEl.innerHTML = `<strong>☕ Barista Insights:</strong><br>${res.answer}`
		}
	})

	// WebMCP Tool Invoker Form
	document.getElementById('webmcp-invoke-form')?.addEventListener('submit', async (e) => {
		e.preventDefault()
		const toolName = document.getElementById('webmcp-tool-select')?.value
		const argsRaw = document.getElementById('webmcp-tool-args')?.value
		const outputWrapper = document.getElementById('invoker-output-wrapper')
		const output = document.getElementById('invoker-output')

		try {
			const parsedArgs = argsRaw ? JSON.parse(argsRaw) : {}
			const result = await webMcpManager.callTool(toolName, parsedArgs)
			if (outputWrapper && output) {
				outputWrapper.classList.remove('hidden')
				output.textContent = JSON.stringify(result, null, 2)
			}
		} catch (err) {
			if (outputWrapper && output) {
				outputWrapper.classList.remove('hidden')
				output.textContent = `Error: ${err.message}`
			}
		}
	})

	// WebMCP Accordion Tool Item Header Toggle
	document.addEventListener('click', (e) => {
		const btn = e.target.closest('[data-tool-toggle]')
		if (btn) {
			const toolName = btn.dataset.toolToggle
			document.getElementById(`details-${toolName}`)?.classList.toggle('hidden')
		}
	})

	// Customizer Dialog Trigger Buttons (Quick Order & Customize)
	document.addEventListener('click', (e) => {
		const customizeBtn = e.target.closest('[data-customize-item]')
		if (customizeBtn) {
			openCustomizerDialog(customizeBtn.dataset.customizeItem)
			return
		}

		const quickBtn = e.target.closest('[data-quick-order]')
		if (quickBtn) {
			const itemId = Number(quickBtn.dataset.quickOrder)
			webMcpManager.callTool('place_order', {
				userId: state.currentUser.id,
				orderedVia: 'web_ui',
				tableLabel: state.currentUser.tableLabel,
				items: [{ menuItemId: itemId, quantity: 1, customizations: {} }]
			})
		}
	})

	// Customizer Dialog Close Button (× in top-right header)
	document.getElementById('btn-close-customizer')?.addEventListener('click', () => {
		document.getElementById('customizer-dialog')?.close()
	})

	// Customizer Stepper Buttons (− / +)
	document.getElementById('btn-qty-minus')?.addEventListener('click', () => {
		if (state.customizerQuantity > 1) {
			state.customizerQuantity--
			const el = document.getElementById('customizer-qty')
			if (el) el.textContent = String(state.customizerQuantity)
			updateCustomizerTotalButton()
		}
	})
	document.getElementById('btn-qty-plus')?.addEventListener('click', () => {
		if (state.customizerQuantity < 10) {
			state.customizerQuantity++
			const el = document.getElementById('customizer-qty')
			if (el) el.textContent = String(state.customizerQuantity)
			updateCustomizerTotalButton()
		}
	})

	// Customizer Options Radio Change Listener
	document.getElementById('customizer-groups-container')?.addEventListener('change', () => {
		updateCustomizerTotalButton()
	})

	// Customizer Form Submission
	document.getElementById('customizer-form')?.addEventListener('submit', (e) => {
		e.preventDefault()
		if (!state.customizerTargetItem) return

		const selections = {}
		document.querySelectorAll('#customizer-groups-container input[type="radio"]:checked').forEach(radio => {
			const groupName = radio.closest('.customizer-group')?.dataset.groupName
			if (groupName) selections[groupName] = radio.value
		})

		const kitchenNote = document.getElementById('customizer-kitchen-note')?.value

		// Execute Order
		webMcpManager.callTool('place_order', {
			userId: state.currentUser.id,
			orderedVia: 'web_ui',
			tableLabel: state.currentUser.tableLabel,
			notes: kitchenNote || undefined,
			items: [
				{
					menuItemId: state.customizerTargetItem.id,
					quantity: state.customizerQuantity,
					customizations: selections
				}
			]
		})

		document.getElementById('customizer-dialog')?.close()
	})

	// Refresh owner data button
	document.getElementById('btn-refresh-owner-data')?.addEventListener('click', () => {
		renderOwnerPortal()
		showToast('Operational data refreshed!', 'toast-info')
	})

	// Simulate incoming order button (for interactive demonstrations)
	document.getElementById('btn-simulate-order')?.addEventListener('click', () => {
		const simulatedId = Math.floor(200 + Math.random() * 800)
		state.orders.unshift({
			id: simulatedId,
			userId: 'guest',
			customerName: 'Guest • Table 5',
			tableLabel: 'Table 5',
			status: 'Pending',
			orderedVia: 'webmcp_agent',
			waitMinutes: 5,
			placedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
			items: [
				{
					menuItemId: 10,
					itemName: 'BrewMesh Brioche Burger',
					quantity: 1,
					price: 380,
					customizations: { 'Patty Style': 'Crispy Sweet Potato & Herb' }
				}
			],
			totalPrice: 380
		})
		renderKitchenQueue()
		showToast(`Simulated agent order #${simulatedId} received in KOT!`, 'toast-info')
	})
}

// ============================================================================
// 8. Application Bootstrap
// ============================================================================

window.addEventListener('DOMContentLoaded', async () => {
	await initializeWebMcpTools()
	setupEventListeners()

	// Initial renders
	renderWallet()
	renderSidebarProfile()
	renderHeroOptinCard()
	renderFullMenu('All', '', false)
	renderGamesGrid('ALL', false)
	renderNearbyCafesGrid(false)
	renderTableConnect()
	renderOrders()
	renderIncomingWaves()
	renderRoomVibes()
	renderOwnerPortal()

	// Connect SSE stream
	connectEventSource()
})
