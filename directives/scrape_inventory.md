# Example Directive: Scrape Stock Data

## Goal
Scrape live stock prices or inventory levels from a vendor API or website.

## Inputs
- `vendor_url`: URL of the vendor's inventory page.
- `api_key`: Optional API key for vendor authentication.

## Tools/Scripts
- `execution/scrape_inventory.py`: Python script used to perform the actual scraping.

## Outputs
- `inventory_report.json`: JSON file in `.tmp/` containing the scraped data.
- `status`: Success/Failure status.

## Edge Cases
- Vendor site is down.
- Rate limits reached.
