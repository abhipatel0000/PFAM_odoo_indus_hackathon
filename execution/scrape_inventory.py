import os
import sys
import json

def scrape_inventory(url):
    print(f"Actually scraping inventory from {url}...")
    # Deterministic logic here (mocked for example)
    data = {
        "vendor": url,
        "items": [
            {"name": "Steel Rod", "price": 150, "stock": 500},
            {"name": "Office Chair", "price": 45, "stock": 120}
        ]
    }
    
    tmp_path = os.path.join('.tmp', 'inventory_report.json')
    with open(tmp_path, 'w') as f:
        json.dump(data, f, indent=4)
    
    print(f"Report saved to {tmp_path}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scrape_inventory.py <url>")
    else:
        scrape_inventory(sys.argv[1])
