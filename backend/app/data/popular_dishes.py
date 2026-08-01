# Curated reference data, not an estimate or live lookup -- popular
# national/regional dishes are stable cultural facts, unlike prices,
# so hand-curating this list carries none of the "duplicate fake number"
# risk that hardcoded averageCost values did. Countries not listed here
# simply get no dishes shown (same honesty principle used everywhere
# else) rather than a guess.
POPULAR_DISHES = {
    "India": ["Butter Chicken", "Biryani", "Masala Dosa", "Chole Bhature", "Rogan Josh"],
    "Japan": ["Sushi", "Ramen", "Tempura", "Okonomiyaki", "Miso Soup"],
    "Italy": ["Pizza Margherita", "Risotto", "Lasagna", "Carbonara", "Tiramisu"],
    "France": ["Croissant", "Coq au Vin", "Ratatouille", "Crème Brûlée", "French Onion Soup"],
    "United Kingdom": ["Fish and Chips", "Sunday Roast", "Shepherd's Pie", "Full English Breakfast", "Bangers and Mash"],
    "United States": ["Hamburger", "BBQ Ribs", "Apple Pie", "Mac and Cheese", "Clam Chowder"],
    "Thailand": ["Pad Thai", "Tom Yum Goong", "Green Curry", "Som Tam", "Mango Sticky Rice"],
    "Indonesia": ["Nasi Goreng", "Satay", "Rendang", "Gado-Gado", "Soto Ayam"],
    "Maldives": ["Mas Huni", "Garudhiya", "Fihunu Mas", "Rihaakuru", "Bambukeylu Hiti"],
    "United Arab Emirates": ["Al Machboos", "Shawarma", "Hummus", "Luqaimat", "Harees"],
    "Singapore": ["Chili Crab", "Hainanese Chicken Rice", "Laksa", "Char Kway Teow", "Satay"],
    "Greece": ["Moussaka", "Souvlaki", "Greek Salad", "Spanakopita", "Tzatziki"],
    "Australia": ["Meat Pie", "Lamington", "Barramundi", "Vegemite Toast", "Pavlova"],
    "Switzerland": ["Fondue", "Raclette", "Rösti", "Älplermagronen", "Swiss Chocolate"],
    "Spain": ["Paella", "Tapas", "Tortilla Española", "Gazpacho", "Churros"],
    "Germany": ["Bratwurst", "Sauerbraten", "Schnitzel", "Pretzel", "Sauerkraut"],
    "Mexico": ["Tacos", "Enchiladas", "Tamales", "Guacamole", "Mole"],
    "China": ["Peking Duck", "Dumplings", "Kung Pao Chicken", "Mapo Tofu", "Hot Pot"],
    "Vietnam": ["Pho", "Banh Mi", "Spring Rolls", "Bun Cha", "Cao Lau"],
    "Turkey": ["Kebab", "Baklava", "Turkish Delight", "Meze", "Lahmacun"],
    "Portugal": ["Bacalhau", "Pastel de Nata", "Caldo Verde", "Francesinha", "Piri Piri Chicken"],
    "Netherlands": ["Stroopwafel", "Bitterballen", "Herring", "Poffertjes", "Erwtensoep"],
    "Egypt": ["Koshari", "Ful Medames", "Molokhia", "Ta'ameya", "Om Ali"],
    "Morocco": ["Tagine", "Couscous", "Pastilla", "Harira", "Mint Tea"],
    "Brazil": ["Feijoada", "Pão de Queijo", "Churrasco", "Moqueca", "Brigadeiro"],
    "Peru": ["Ceviche", "Lomo Saltado", "Aji de Gallina", "Anticuchos", "Causa"],
    "Nepal": ["Momo", "Dal Bhat", "Sel Roti", "Thukpa", "Gundruk"],
    "Sri Lanka": ["Kottu", "Hoppers", "Rice and Curry", "Lamprais", "Watalappan"],
    "South Korea": ["Kimchi", "Bibimbap", "Bulgogi", "Tteokbokki", "Korean BBQ"],
    "Malaysia": ["Nasi Lemak", "Char Kway Teow", "Satay", "Laksa", "Rendang"],
    "Philippines": ["Adobo", "Sinigang", "Lechon", "Pancit", "Halo-Halo"],
    "Russia": ["Borscht", "Pelmeni", "Beef Stroganoff", "Blini", "Pirozhki"],
    "Canada": ["Poutine", "Butter Tart", "Tourtière", "Nanaimo Bar", "Maple Syrup Pancakes"],
    "New Zealand": ["Hangi", "Pavlova", "Meat Pie", "Whitebait Fritters", "Kiwi Fruit Pie"],
    "South Africa": ["Bobotie", "Biltong", "Bunny Chow", "Boerewors", "Malva Pudding"],
    "Argentina": ["Asado", "Empanadas", "Milanesa", "Choripán", "Dulce de Leche"],
    "Austria": ["Wiener Schnitzel", "Sachertorte", "Apple Strudel", "Tafelspitz", "Kaiserschmarrn"],
    "Ireland": ["Irish Stew", "Soda Bread", "Colcannon", "Boxty", "Full Irish Breakfast"],
}


def get_popular_dishes(country):
    if not country:
        return []

    for name, dishes in POPULAR_DISHES.items():
        if name.lower() == country.strip().lower():
            return dishes

    return []
