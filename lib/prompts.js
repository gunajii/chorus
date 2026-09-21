// Chorus — shared prompt bank + game logic (server-side source of truth).
// Every answer is ONE WORD so players can actually type it. Questions are
// globally relatable. One puzzle per day (resets at midnight in the configured
// timezone). Each prompt's weights are both the fair answer key and the seeded
// crowd %. Schedule = these 100 prompts, then any generated prompts (DB pool).

export const PRIOR_SCALE = 1;

// Launch anchor (puzzle No.1). Set NEXT_PUBLIC_LAUNCH_DATE=YYYY-MM-DD.
const LAUNCH = (process.env.NEXT_PUBLIC_LAUNCH_DATE || "2026-01-01");
// Reset timezone: minutes east of UTC. 330 = IST (midnight reset in India),
// 0 = UTC, -300 = US Eastern (winter). Both the day rollover AND the countdown
// use this, so "next puzzle in …" always hits 0 exactly when the puzzle changes.
const TZ_OFFSET = Number(process.env.NEXT_PUBLIC_TZ_OFFSET_MINUTES || 0);

export const PROMPTS = [
  {q:"The best pizza topping?",o:[{l:"Pepperoni",k:"pepperoni",w:30},{l:"Cheese",k:"cheese",w:22},{l:"Mushroom",k:"mushroom",w:16},{l:"Chicken",k:"chicken",w:14},{l:"Onion",k:"onion",w:9},{l:"Pineapple",k:"pineapple",w:9}]},
  {q:"Cats or dogs?",o:[{l:"Dogs",k:"dogs",w:52,a:["dog"]},{l:"Cats",k:"cats",w:40,a:["cat"]},{l:"Both",k:"both",w:8}]},
  {q:"The best ice-cream flavour?",o:[{l:"Chocolate",k:"chocolate",w:30},{l:"Vanilla",k:"vanilla",w:22},{l:"Strawberry",k:"strawberry",w:18},{l:"Mango",k:"mango",w:12},{l:"Mint",k:"mint",w:10},{l:"Butterscotch",k:"butterscotch",w:8}]},
  {q:"The best season?",o:[{l:"Winter",k:"winter",w:32},{l:"Summer",k:"summer",w:24},{l:"Autumn",k:"autumn",w:18,a:["fall"]},{l:"Spring",k:"spring",w:18},{l:"Monsoon",k:"monsoon",w:8,a:["rainy"]}]},
  {q:"The superpower everyone wants?",o:[{l:"Flying",k:"flying",w:28,a:["fly"]},{l:"Teleportation",k:"teleportation",w:24,a:["teleport"]},{l:"Invisibility",k:"invisibility",w:20,a:["invisible"]},{l:"Telepathy",k:"telepathy",w:16,a:["mindreading"]},{l:"Immortality",k:"immortality",w:12}]},
  {q:"The worst household chore?",o:[{l:"Dishes",k:"dishes",w:28},{l:"Laundry",k:"laundry",w:20},{l:"Mopping",k:"mopping",w:16},{l:"Ironing",k:"ironing",w:14},{l:"Sweeping",k:"sweeping",w:12},{l:"Cooking",k:"cooking",w:10}]},
  {q:"The best day of the week?",o:[{l:"Saturday",k:"saturday",w:32},{l:"Friday",k:"friday",w:30},{l:"Sunday",k:"sunday",w:22},{l:"Wednesday",k:"wednesday",w:8},{l:"Monday",k:"monday",w:8}]},
  {q:"The most overrated fast-food chain?",o:[{l:"McDonald's",k:"mcdonalds",w:34,a:["mcd","mcdonald"]},{l:"KFC",k:"kfc",w:22},{l:"Subway",k:"subway",w:20},{l:"Starbucks",k:"starbucks",w:14},{l:"Domino's",k:"dominos",w:10}]},
  {q:"The best way to travel?",o:[{l:"Plane",k:"plane",w:28,a:["flight","airplane"]},{l:"Car",k:"car",w:26,a:["roadtrip"]},{l:"Train",k:"train",w:24},{l:"Cruise",k:"cruise",w:12,a:["ship"]},{l:"Bike",k:"bike",w:10,a:["motorcycle"]}]},
  {q:"Mountains or beaches?",o:[{l:"Mountains",k:"mountains",w:50,a:["mountain"]},{l:"Beaches",k:"beaches",w:44,a:["beach"]},{l:"Both",k:"both",w:6}]},
  {q:"iPhone or Android?",o:[{l:"iPhone",k:"iphone",w:48,a:["apple","ios"]},{l:"Android",k:"android",w:46},{l:"Both",k:"both",w:6}]},
  {q:"The best programming language?",o:[{l:"Python",k:"python",w:34,a:["py"]},{l:"JavaScript",k:"javascript",w:22,a:["js"]},{l:"C++",k:"cpp",w:16,a:["cplusplus"]},{l:"Java",k:"java",w:14},{l:"Rust",k:"rust",w:8},{l:"Go",k:"go",w:6,a:["golang"]}]},
  {q:"The best movie genre?",o:[{l:"Action",k:"action",w:26},{l:"Comedy",k:"comedy",w:24},{l:"Horror",k:"horror",w:16},{l:"Thriller",k:"thriller",w:14},{l:"Romance",k:"romance",w:12},{l:"Fantasy",k:"fantasy",w:8}]},
  {q:"The best pet (not a cat or dog)?",o:[{l:"Fish",k:"fish",w:26},{l:"Parrot",k:"parrot",w:22,a:["bird"]},{l:"Rabbit",k:"rabbit",w:20,a:["bunny"]},{l:"Hamster",k:"hamster",w:16},{l:"Turtle",k:"turtle",w:10,a:["tortoise"]}]},
  {q:"The scariest animal?",o:[{l:"Snake",k:"snake",w:26},{l:"Spider",k:"spider",w:22},{l:"Shark",k:"shark",w:20},{l:"Lion",k:"lion",w:14},{l:"Bear",k:"bear",w:10},{l:"Crocodile",k:"crocodile",w:8,a:["alligator"]}]},
  {q:"The best cuisine?",o:[{l:"Italian",k:"italian",w:26},{l:"Chinese",k:"chinese",w:22},{l:"Indian",k:"indian",w:18},{l:"Mexican",k:"mexican",w:16},{l:"Japanese",k:"japanese",w:12,a:["sushi"]},{l:"Thai",k:"thai",w:6}]},
  {q:"Coffee or tea?",o:[{l:"Coffee",k:"coffee",w:50},{l:"Tea",k:"tea",w:44,a:["chai"]},{l:"Neither",k:"neither",w:6}]},
  {q:"The best superhero?",o:[{l:"Spider-Man",k:"spiderman",w:26,a:["spidey"]},{l:"Batman",k:"batman",w:24},{l:"Superman",k:"superman",w:18},{l:"Thor",k:"thor",w:12},{l:"Hulk",k:"hulk",w:10},{l:"Deadpool",k:"deadpool",w:6}]},
  {q:"Marvel or DC?",o:[{l:"Marvel",k:"marvel",w:64},{l:"DC",k:"dc",w:30},{l:"Neither",k:"neither",w:6}]},
  {q:"The app that wastes your time most?",o:[{l:"Instagram",k:"instagram",w:28,a:["insta","ig"]},{l:"YouTube",k:"youtube",w:24,a:["yt"]},{l:"TikTok",k:"tiktok",w:20},{l:"Reddit",k:"reddit",w:12},{l:"WhatsApp",k:"whatsapp",w:10},{l:"Twitter",k:"twitter",w:6,a:["x"]}]},
  {q:"The ultimate comfort food?",o:[{l:"Pizza",k:"pizza",w:28},{l:"Chocolate",k:"chocolate",w:18},{l:"Pasta",k:"pasta",w:16},{l:"Burger",k:"burger",w:14},{l:"Noodles",k:"noodles",w:14,a:["ramen"]},{l:"Fries",k:"fries",w:10}]},
  {q:"The worst pizza topping?",o:[{l:"Pineapple",k:"pineapple",w:40},{l:"Anchovies",k:"anchovies",w:22},{l:"Olives",k:"olives",w:14},{l:"Mushroom",k:"mushroom",w:14},{l:"Corn",k:"corn",w:10}]},
  {q:"The best fruit?",o:[{l:"Mango",k:"mango",w:26},{l:"Banana",k:"banana",w:20},{l:"Apple",k:"apple",w:18},{l:"Strawberry",k:"strawberry",w:16},{l:"Watermelon",k:"watermelon",w:12},{l:"Grapes",k:"grapes",w:8}]},
  {q:"Chocolate or vanilla?",o:[{l:"Chocolate",k:"chocolate",w:62},{l:"Vanilla",k:"vanilla",w:32},{l:"Both",k:"both",w:6}]},
  {q:"Sweet or savoury?",o:[{l:"Sweet",k:"sweet",w:48},{l:"Savoury",k:"savoury",w:46,a:["savory","salty"]},{l:"Both",k:"both",w:6}]},
  {q:"The best fast-food item?",o:[{l:"Fries",k:"fries",w:28},{l:"Burger",k:"burger",w:26},{l:"Nuggets",k:"nuggets",w:18},{l:"Pizza",k:"pizza",w:16},{l:"Tacos",k:"tacos",w:12}]},
  {q:"The best breakfast?",o:[{l:"Pancakes",k:"pancakes",w:24},{l:"Eggs",k:"eggs",w:22},{l:"Cereal",k:"cereal",w:18},{l:"Toast",k:"toast",w:14},{l:"Waffles",k:"waffles",w:12},{l:"Oats",k:"oats",w:10,a:["oatmeal"]}]},
  {q:"The most annoying sound?",o:[{l:"Alarm",k:"alarm",w:28},{l:"Mosquito",k:"mosquito",w:22},{l:"Chewing",k:"chewing",w:18},{l:"Snoring",k:"snoring",w:18},{l:"Screaming",k:"screaming",w:14}]},
  {q:"The worst way to wake up?",o:[{l:"Alarm",k:"alarm",w:32},{l:"Shouting",k:"shouting",w:22,a:["yelling"]},{l:"Sunlight",k:"sunlight",w:18,a:["sun"]},{l:"Nightmare",k:"nightmare",w:16},{l:"Noise",k:"noise",w:12}]},
  {q:"Morning person or night person?",o:[{l:"Night",k:"night",w:56,a:["nightowl"]},{l:"Morning",k:"morning",w:38,a:["earlybird"]},{l:"Neither",k:"neither",w:6}]},
  {q:"Introvert or extrovert?",o:[{l:"Introvert",k:"introvert",w:52},{l:"Extrovert",k:"extrovert",w:34},{l:"Ambivert",k:"ambivert",w:14,a:["both"]}]},
  {q:"The best holiday?",o:[{l:"Christmas",k:"christmas",w:30,a:["xmas"]},{l:"Halloween",k:"halloween",w:22},{l:"Birthday",k:"birthday",w:20},{l:"Thanksgiving",k:"thanksgiving",w:16},{l:"Easter",k:"easter",w:12}]},
  {q:"What did you want to be as a kid?",o:[{l:"Doctor",k:"doctor",w:24},{l:"Astronaut",k:"astronaut",w:20},{l:"Teacher",k:"teacher",w:16},{l:"Pilot",k:"pilot",w:16},{l:"Scientist",k:"scientist",w:14},{l:"Athlete",k:"athlete",w:10}]},
  {q:"The best colour?",o:[{l:"Blue",k:"blue",w:30},{l:"Black",k:"black",w:20},{l:"Green",k:"green",w:16},{l:"Red",k:"red",w:14},{l:"Purple",k:"purple",w:12},{l:"Pink",k:"pink",w:8}]},
  {q:"Texting or calling?",o:[{l:"Texting",k:"texting",w:62,a:["text"]},{l:"Calling",k:"calling",w:30,a:["call"]},{l:"Depends",k:"depends",w:8}]},
  {q:"The best streaming service?",o:[{l:"Netflix",k:"netflix",w:36},{l:"YouTube",k:"youtube",w:24,a:["yt"]},{l:"Prime",k:"prime",w:16,a:["amazon"]},{l:"Disney",k:"disney",w:14,a:["disneyplus"]},{l:"Hulu",k:"hulu",w:10}]},
  {q:"Cake or pie?",o:[{l:"Cake",k:"cake",w:64},{l:"Pie",k:"pie",w:30},{l:"Both",k:"both",w:6}]},
  {q:"The best board game?",o:[{l:"Monopoly",k:"monopoly",w:30},{l:"Chess",k:"chess",w:24},{l:"Scrabble",k:"scrabble",w:16},{l:"Uno",k:"uno",w:16},{l:"Catan",k:"catan",w:8},{l:"Ludo",k:"ludo",w:6}]},
  {q:"The best video-game genre?",o:[{l:"Shooter",k:"shooter",w:24,a:["fps"]},{l:"RPG",k:"rpg",w:20},{l:"Sports",k:"sports",w:16},{l:"Racing",k:"racing",w:16},{l:"Strategy",k:"strategy",w:14},{l:"Puzzle",k:"puzzle",w:10}]},
  {q:"The most overrated tech company?",o:[{l:"Apple",k:"apple",w:34},{l:"Tesla",k:"tesla",w:22},{l:"Meta",k:"meta",w:18,a:["facebook"]},{l:"Google",k:"google",w:16},{l:"Microsoft",k:"microsoft",w:10}]},
  {q:"The best pizza crust?",o:[{l:"Thin",k:"thin",w:34},{l:"Cheesy",k:"cheesy",w:24,a:["cheeseburst"]},{l:"Thick",k:"thick",w:18,a:["deepdish"]},{l:"Stuffed",k:"stuffed",w:16},{l:"Pan",k:"pan",w:8}]},
  {q:"The worst vegetable?",o:[{l:"Broccoli",k:"broccoli",w:26},{l:"Cabbage",k:"cabbage",w:20},{l:"Eggplant",k:"eggplant",w:16,a:["brinjal","aubergine"]},{l:"Spinach",k:"spinach",w:16},{l:"Beetroot",k:"beetroot",w:12},{l:"Okra",k:"okra",w:10,a:["ladyfinger"]}]},
  {q:"The best sandwich filling?",o:[{l:"Cheese",k:"cheese",w:24},{l:"Chicken",k:"chicken",w:22},{l:"Egg",k:"egg",w:18},{l:"Tuna",k:"tuna",w:14},{l:"Ham",k:"ham",w:12},{l:"Veggie",k:"veggie",w:10}]},
  {q:"Window or aisle seat?",o:[{l:"Window",k:"window",w:60},{l:"Aisle",k:"aisle",w:34},{l:"Middle",k:"middle",w:6}]},
  {q:"Spicy or mild food?",o:[{l:"Spicy",k:"spicy",w:52},{l:"Medium",k:"medium",w:26},{l:"Mild",k:"mild",w:22}]},
  {q:"The best time of day?",o:[{l:"Night",k:"night",w:34},{l:"Evening",k:"evening",w:26},{l:"Morning",k:"morning",w:24},{l:"Afternoon",k:"afternoon",w:16}]},
  {q:"The worst weather?",o:[{l:"Heat",k:"heat",w:30,a:["hot"]},{l:"Humidity",k:"humidity",w:22,a:["humid"]},{l:"Cold",k:"cold",w:18},{l:"Rain",k:"rain",w:16},{l:"Snow",k:"snow",w:14}]},
  {q:"Your biggest fear?",o:[{l:"Heights",k:"heights",w:26},{l:"Spiders",k:"spiders",w:20},{l:"Snakes",k:"snakes",w:18},{l:"Darkness",k:"darkness",w:14,a:["dark"]},{l:"Failure",k:"failure",w:12},{l:"Death",k:"death",w:10}]},
  {q:"The best dessert?",o:[{l:"Cake",k:"cake",w:24},{l:"Cheesecake",k:"cheesecake",w:18},{l:"Brownie",k:"brownie",w:18},{l:"Chocolate",k:"chocolate",w:16},{l:"Donut",k:"donut",w:14,a:["doughnut"]},{l:"Pudding",k:"pudding",w:10}]},
  {q:"The best drink on a hot day?",o:[{l:"Lemonade",k:"lemonade",w:28},{l:"Water",k:"water",w:24},{l:"Cola",k:"cola",w:18,a:["coke"]},{l:"Juice",k:"juice",w:16},{l:"Soda",k:"soda",w:8},{l:"Coconut",k:"coconut",w:6}]},
  {q:"The best snack?",o:[{l:"Chips",k:"chips",w:28,a:["crisps"]},{l:"Popcorn",k:"popcorn",w:22},{l:"Chocolate",k:"chocolate",w:18},{l:"Cookies",k:"cookies",w:16,a:["biscuits"]},{l:"Nuts",k:"nuts",w:8}]},
  {q:"Milk, dark, or white chocolate?",o:[{l:"Milk",k:"milk",w:50},{l:"Dark",k:"dark",w:36},{l:"White",k:"white",w:14}]},
  {q:"The best kind of music?",o:[{l:"Pop",k:"pop",w:26},{l:"Rap",k:"rap",w:22,a:["hiphop"]},{l:"Rock",k:"rock",w:20},{l:"EDM",k:"edm",w:12},{l:"Classical",k:"classical",w:10},{l:"Jazz",k:"jazz",w:10}]},
  {q:"The best instrument?",o:[{l:"Guitar",k:"guitar",w:34},{l:"Piano",k:"piano",w:28},{l:"Drums",k:"drums",w:16},{l:"Violin",k:"violin",w:14},{l:"Flute",k:"flute",w:8}]},
  {q:"Would you rather save or spend?",o:[{l:"Save",k:"save",w:52},{l:"Spend",k:"spend",w:38},{l:"Depends",k:"depends",w:10}]},
  {q:"Pineapple on pizza?",o:[{l:"No",k:"no",w:60,a:["nope"]},{l:"Yes",k:"yes",w:40,a:["yeah"]}]},
  {q:"Rich or famous?",o:[{l:"Rich",k:"rich",w:72},{l:"Famous",k:"famous",w:22},{l:"Both",k:"both",w:6}]},
  {q:"The best way to exercise?",o:[{l:"Running",k:"running",w:24,a:["jogging"]},{l:"Gym",k:"gym",w:22,a:["weights"]},{l:"Walking",k:"walking",w:18},{l:"Cycling",k:"cycling",w:14},{l:"Swimming",k:"swimming",w:12},{l:"Yoga",k:"yoga",w:10}]},
  {q:"Tabs or spaces?",o:[{l:"Spaces",k:"spaces",w:56},{l:"Tabs",k:"tabs",w:44}]},
  {q:"Light mode or dark mode?",o:[{l:"Dark",k:"dark",w:70,a:["darkmode"]},{l:"Light",k:"light",w:30,a:["lightmode"]}]},
  {q:"The best web browser?",o:[{l:"Chrome",k:"chrome",w:48},{l:"Safari",k:"safari",w:18},{l:"Firefox",k:"firefox",w:16},{l:"Edge",k:"edge",w:12},{l:"Brave",k:"brave",w:6}]},
  {q:"The best way to relax?",o:[{l:"Sleep",k:"sleep",w:24},{l:"Music",k:"music",w:22},{l:"Gaming",k:"gaming",w:18,a:["games"]},{l:"Reading",k:"reading",w:14,a:["books"]},{l:"TV",k:"tv",w:12,a:["movies"]},{l:"Walking",k:"walking",w:10}]},
  {q:"The worst pain?",o:[{l:"Headache",k:"headache",w:26},{l:"Toothache",k:"toothache",w:22},{l:"Cramp",k:"cramp",w:18},{l:"Burn",k:"burn",w:16},{l:"Sunburn",k:"sunburn",w:10},{l:"Splinter",k:"splinter",w:8}]},
  {q:"Ketchup or mustard?",o:[{l:"Ketchup",k:"ketchup",w:56},{l:"Mayo",k:"mayo",w:20,a:["mayonnaise"]},{l:"Mustard",k:"mustard",w:18},{l:"Neither",k:"neither",w:6}]},
  {q:"The best takeout?",o:[{l:"Pizza",k:"pizza",w:26},{l:"Chinese",k:"chinese",w:22},{l:"Burgers",k:"burgers",w:18},{l:"Sushi",k:"sushi",w:14},{l:"Tacos",k:"tacos",w:12},{l:"Chicken",k:"chicken",w:8}]},
  {q:"The best movie-night snack?",o:[{l:"Popcorn",k:"popcorn",w:40},{l:"Chips",k:"chips",w:22,a:["crisps"]},{l:"Nachos",k:"nachos",w:14},{l:"Candy",k:"candy",w:14,a:["sweets"]},{l:"Chocolate",k:"chocolate",w:10}]},
  {q:"Beach or pool?",o:[{l:"Beach",k:"beach",w:56},{l:"Pool",k:"pool",w:38},{l:"Neither",k:"neither",w:6}]},
  {q:"The best gift to receive?",o:[{l:"Money",k:"money",w:28,a:["cash"]},{l:"Gadgets",k:"gadgets",w:22},{l:"Clothes",k:"clothes",w:16},{l:"Books",k:"books",w:14},{l:"Chocolate",k:"chocolate",w:12},{l:"Food",k:"food",w:8}]},
  {q:"The most useless school subject?",o:[{l:"Trigonometry",k:"trigonometry",w:24,a:["trig"]},{l:"History",k:"history",w:20},{l:"Chemistry",k:"chemistry",w:16},{l:"Algebra",k:"algebra",w:16},{l:"Geography",k:"geography",w:14},{l:"Poetry",k:"poetry",w:10}]},
  {q:"Your favourite school subject?",o:[{l:"Maths",k:"maths",w:24,a:["math"]},{l:"Science",k:"science",w:22},{l:"English",k:"english",w:18},{l:"Art",k:"art",w:16},{l:"Biology",k:"biology",w:12},{l:"History",k:"history",w:8}]},
  {q:"The best kind of shoe?",o:[{l:"Sneakers",k:"sneakers",w:52,a:["trainers"]},{l:"Sandals",k:"sandals",w:18},{l:"Boots",k:"boots",w:16},{l:"Loafers",k:"loafers",w:8},{l:"Heels",k:"heels",w:6}]},
  {q:"The best weather to sleep in?",o:[{l:"Rainy",k:"rainy",w:34,a:["rain"]},{l:"Cold",k:"cold",w:26},{l:"Cool",k:"cool",w:20},{l:"Stormy",k:"stormy",w:12},{l:"Cloudy",k:"cloudy",w:8}]},
  {q:"Give up your phone or music?",o:[{l:"Music",k:"music",w:54},{l:"Phone",k:"phone",w:46}]},
  {q:"If you were an animal?",o:[{l:"Lion",k:"lion",w:22},{l:"Wolf",k:"wolf",w:20},{l:"Eagle",k:"eagle",w:16},{l:"Dolphin",k:"dolphin",w:16},{l:"Tiger",k:"tiger",w:16},{l:"Cat",k:"cat",w:10}]},
  {q:"The best way to eat eggs?",o:[{l:"Scrambled",k:"scrambled",w:26},{l:"Fried",k:"fried",w:24},{l:"Omelette",k:"omelette",w:20,a:["omelet"]},{l:"Boiled",k:"boiled",w:18},{l:"Poached",k:"poached",w:12}]},
  {q:"The best juice?",o:[{l:"Orange",k:"orange",w:30},{l:"Mango",k:"mango",w:22},{l:"Apple",k:"apple",w:20},{l:"Grape",k:"grape",w:14},{l:"Pineapple",k:"pineapple",w:8},{l:"Pomegranate",k:"pomegranate",w:6}]},
  {q:"The best superpower for students?",o:[{l:"Memory",k:"memory",w:30},{l:"Teleportation",k:"teleportation",w:22},{l:"Cloning",k:"cloning",w:18},{l:"Telepathy",k:"telepathy",w:16},{l:"Invisibility",k:"invisibility",w:14}]},
  {q:"The best kind of vacation?",o:[{l:"Beach",k:"beach",w:28},{l:"Mountains",k:"mountains",w:22},{l:"City",k:"city",w:18},{l:"Cruise",k:"cruise",w:14},{l:"Adventure",k:"adventure",w:10},{l:"Camping",k:"camping",w:8}]},
  {q:"The most annoying kitchen chore?",o:[{l:"Dishes",k:"dishes",w:34},{l:"Trash",k:"trash",w:22,a:["garbage"]},{l:"Mopping",k:"mopping",w:16},{l:"Fridge",k:"fridge",w:16},{l:"Scrubbing",k:"scrubbing",w:12}]},
  {q:"The best fictional place to live?",o:[{l:"Hogwarts",k:"hogwarts",w:32},{l:"Wakanda",k:"wakanda",w:22},{l:"Narnia",k:"narnia",w:18},{l:"Neverland",k:"neverland",w:16},{l:"Asgard",k:"asgard",w:12}]},
  {q:"The best midnight snack?",o:[{l:"Chips",k:"chips",w:24,a:["crisps"]},{l:"Leftovers",k:"leftovers",w:20},{l:"Cereal",k:"cereal",w:18},{l:"Noodles",k:"noodles",w:16,a:["ramen","maggi"]},{l:"Chocolate",k:"chocolate",w:12},{l:"Cookies",k:"cookies",w:10}]},
  {q:"The best way to spend a weekend?",o:[{l:"Sleep",k:"sleep",w:24},{l:"Friends",k:"friends",w:22},{l:"Travel",k:"travel",w:18},{l:"Movies",k:"movies",w:16},{l:"Gaming",k:"gaming",w:12},{l:"Reading",k:"reading",w:8}]},
  {q:"The scariest thing?",o:[{l:"Ghosts",k:"ghosts",w:24},{l:"Heights",k:"heights",w:22},{l:"Darkness",k:"darkness",w:18,a:["dark"]},{l:"Spiders",k:"spiders",w:16},{l:"Clowns",k:"clowns",w:12},{l:"Death",k:"death",w:8}]},
  {q:"The best kind of coffee?",o:[{l:"Latte",k:"latte",w:26},{l:"Cappuccino",k:"cappuccino",w:22},{l:"Espresso",k:"espresso",w:18},{l:"Mocha",k:"mocha",w:14},{l:"Americano",k:"americano",w:12},{l:"Frappe",k:"frappe",w:8}]},
  {q:"The best kind of cookie?",o:[{l:"Chocolate",k:"chocolate",w:38,a:["chocchip","chocolatechip"]},{l:"Oreo",k:"oreo",w:20},{l:"Oatmeal",k:"oatmeal",w:16},{l:"Sugar",k:"sugar",w:14},{l:"Shortbread",k:"shortbread",w:12}]},
  {q:"The best thing about weekends?",o:[{l:"Sleep",k:"sleep",w:28},{l:"Freedom",k:"freedom",w:22,a:["nowork"]},{l:"Friends",k:"friends",w:18},{l:"Hobbies",k:"hobbies",w:16},{l:"Relaxing",k:"relaxing",w:16}]},
  {q:"The best kind of pasta?",o:[{l:"Spaghetti",k:"spaghetti",w:30},{l:"Macaroni",k:"macaroni",w:22,a:["macandcheese"]},{l:"Penne",k:"penne",w:18},{l:"Lasagna",k:"lasagna",w:18},{l:"Ravioli",k:"ravioli",w:12}]},
  {q:"The best kind of party?",o:[{l:"Birthday",k:"birthday",w:28},{l:"Club",k:"club",w:22},{l:"Pool",k:"pool",w:18},{l:"Beach",k:"beach",w:18},{l:"Rave",k:"rave",w:14}]},
  {q:"The best New Year resolution?",o:[{l:"Fitness",k:"fitness",w:30,a:["exercise","gym"]},{l:"Saving",k:"saving",w:22,a:["savemoney"]},{l:"Diet",k:"diet",w:18,a:["eathealthy"]},{l:"Learning",k:"learning",w:18,a:["learn"]},{l:"Travel",k:"travel",w:12}]},
  {q:"The best thing to do when bored?",o:[{l:"Phone",k:"phone",w:26,a:["scroll"]},{l:"Nap",k:"nap",w:20,a:["sleep"]},{l:"Snack",k:"snack",w:16,a:["eat"]},{l:"Games",k:"games",w:16,a:["gaming"]},{l:"TV",k:"tv",w:12},{l:"Music",k:"music",w:10}]},
  {q:"The best dog breed?",o:[{l:"Labrador",k:"labrador",w:28,a:["lab"]},{l:"Husky",k:"husky",w:22},{l:"Beagle",k:"beagle",w:16},{l:"Bulldog",k:"bulldog",w:14},{l:"Poodle",k:"poodle",w:12},{l:"Pug",k:"pug",w:8}]},
  {q:"The best emoji?",o:[{l:"Laughing",k:"laughing",w:34,a:["haha","crying"]},{l:"Heart",k:"heart",w:22,a:["love"]},{l:"Fire",k:"fire",w:18,a:["lit"]},{l:"Skull",k:"skull",w:16,a:["dead"]},{l:"Thumbsup",k:"thumbsup",w:10,a:["like"]}]},
  {q:"The best way to cook potatoes?",o:[{l:"Fries",k:"fries",w:34,a:["chips"]},{l:"Mashed",k:"mashed",w:24,a:["mash"]},{l:"Roasted",k:"roasted",w:16},{l:"Baked",k:"baked",w:14},{l:"Wedges",k:"wedges",w:12}]},
  {q:"The worst part of Monday?",o:[{l:"Mornings",k:"mornings",w:28,a:["wakingup"]},{l:"Work",k:"work",w:22,a:["school"]},{l:"Alarm",k:"alarm",w:18},{l:"Traffic",k:"traffic",w:16},{l:"Meetings",k:"meetings",w:16}]},
  {q:"The best superpower for lazy people?",o:[{l:"Telekinesis",k:"telekinesis",w:30},{l:"Teleportation",k:"teleportation",w:26},{l:"Cloning",k:"cloning",w:20},{l:"Invisibility",k:"invisibility",w:14},{l:"Flying",k:"flying",w:10}]},
  {q:"The best thing to put on toast?",o:[{l:"Butter",k:"butter",w:26},{l:"Jam",k:"jam",w:22,a:["jelly"]},{l:"Nutella",k:"nutella",w:20},{l:"Peanut",k:"peanut",w:16,a:["peanutbutter"]},{l:"Honey",k:"honey",w:10},{l:"Avocado",k:"avocado",w:6}]},
  {q:"The best pet name?",o:[{l:"Max",k:"max",w:24},{l:"Bella",k:"bella",w:22},{l:"Buddy",k:"buddy",w:18},{l:"Charlie",k:"charlie",w:16},{l:"Coco",k:"coco",w:12},{l:"Rocky",k:"rocky",w:8}]},
  {q:"The best age to be?",o:[{l:"Twenties",k:"twenties",w:40,a:["20s"]},{l:"Teens",k:"teens",w:24,a:["teenager"]},{l:"Childhood",k:"childhood",w:22,a:["kid"]},{l:"Thirties",k:"thirties",w:10,a:["30s"]},{l:"Older",k:"older",w:4}]},
  {q:"The best pizza side?",o:[{l:"Wings",k:"wings",w:32},{l:"Fries",k:"fries",w:26},{l:"Breadsticks",k:"breadsticks",w:18,a:["garlicbread"]},{l:"Salad",k:"salad",w:14},{l:"Dip",k:"dip",w:10,a:["sauce"]}]},
  {q:"The best way to watch a movie?",o:[{l:"Home",k:"home",w:34,a:["couch"]},{l:"Cinema",k:"cinema",w:32,a:["theatre","theater"]},{l:"Bed",k:"bed",w:22},{l:"Phone",k:"phone",w:12}]},
];

const pad = (n) => String(n).padStart(2, "0");

export function norm(s) {
  return (s || "").toLowerCase().normalize("NFKD")
    .replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "");
}
export function titleCase(s) {
  return (s || "").replace(/\w\S*/g, (t) => t.charAt(0).toUpperCase() + t.slice(1).toLowerCase());
}

// Day number since launch, using the configured reset timezone.
export function dayInfo(date = new Date(), pool = []) {
  const schedule = pool && pool.length ? PROMPTS.concat(pool) : PROMPTS;
  const s = new Date(date.getTime() + TZ_OFFSET * 60000);
  const y = s.getUTCFullYear(), m = s.getUTCMonth(), d = s.getUTCDate();
  const day = `${y}-${pad(m + 1)}-${pad(d)}`;
  const [ly, lm, ld] = LAUNCH.split("-").map(Number);
  const n = Math.floor((Date.UTC(y, m, d) - Date.UTC(ly, (lm || 1) - 1, ld || 1)) / 86400000);
  const idx = n >= 0 && n < schedule.length ? n : ((n % schedule.length) + schedule.length) % schedule.length;
  return { day, dayIndex: n < 0 ? 0 : n, prompt: schedule[idx], scheduleLen: schedule.length };
}

// Milliseconds until the next midnight in the reset timezone (for the countdown).
export function msToNextReset(date = new Date()) {
  const s = new Date(date.getTime() + TZ_OFFSET * 60000);
  const next = Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate() + 1, 0, 0, 0);
  return Math.max(0, next - s.getTime());
}

export function puzzleFor(date = new Date(), pool = []) {
  const { day, dayIndex, prompt, scheduleLen } = dayInfo(date, pool);
  const target = Math.min(5, prompt.o.length);
  const budget = target + 2;
  const ranked = [...prompt.o].sort((a, b) => b.w - a.w).slice(0, target)
    .map((o, i) => ({ l: o.l, k: o.k, rank: i }));
  return { day, dayIndex, prompt, target, budget, ranked, scheduleLen };
}

export function resolveKeyFor(prompt, raw) {
  const map = {};
  for (const o of prompt.o) {
    map[o.k] = o.k;
    map[norm(o.l)] = o.k;
    (o.a || []).forEach((x) => (map[norm(x)] = o.k));
  }
  return map[norm(raw)] || norm(raw);
}
export function rankOf(ranked, key) {
  const f = ranked.find((r) => r.k === key);
  return f ? f.rank : null;
}
export function distributionMap(prompt, voteRows) {
  const counts = {};
  for (const o of prompt.o) counts[o.k] = Math.round(o.w * PRIOR_SCALE);
  for (const r of voteRows) counts[r.answer_key] = (counts[r.answer_key] || 0) + 1;
  const total = Object.values(counts).reduce((s, x) => s + x, 0) || 1;
  return { counts, total };
}
export function pctOf(distMap, key) {
  return Math.round(((distMap.counts[key] || 0) / distMap.total) * 100);
}

// Points for uncovering the crowd's #(rank+1) answer. The crowd's top answer is
// worth the most (like Family Feud). target 5 → 100/80/60/40/20.
export function pointsFor(target, rank) { return (target - rank) * 20; }
export function buildGameState(pz, game, dist) {
  const guesses = (game && game.guesses) || [];
  const foundKeys = new Set(guesses.filter((g) => g.hit).map((g) => g.key));
  const over = !!(game && game.finished);
  const slots = pz.ranked.map((r) => {
    const revealed = foundKeys.has(r.k) || over;
    return revealed
      ? { rank: r.rank, revealed: true, label: r.l, pct: pctOf(dist, r.k), found: foundKeys.has(r.k) }
      : { rank: r.rank, revealed: false };
  });
  let result = null;
  if (over) {
    const timeMs = game.finished_at && game.started_at
      ? new Date(game.finished_at) - new Date(game.started_at) : 0;
    const score = pz.ranked.reduce((s, r) => (foundKeys.has(r.k) ? s + pointsFor(pz.target, r.rank) : s), 0);
    result = {
      found: foundKeys.size,
      guesses: guesses.length,
      solvedTop: foundKeys.has(pz.ranked[0].k),
      timeMs: Math.max(0, timeMs),
      score,
    };
  }
  return { slots, guessesUsed: guesses.length, over, result };
}
