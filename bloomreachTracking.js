/// OLD ONE

var dataHelper = new DataLayerHelper(dataLayer);
var dataLayerPageType = dataHelper.get('shoptet.pageType');
var dataHelperCartData = dataHelper.get('shoptet.cart');
var dataHelperOrderData = dataHelper.get('shoptet.order');

var lastClickedButtonType = null;
var lastClickedButtonCopy = null;

function convertString(str) {
    var parts = str.split('|');
    var result = parts.map(part => {
        if (part.includes('::')) {
        return part.split('::')[0];
        } else if (part.includes('--')) {
        return part.split('--')[0];
        }
        return part;
    });
    return result.filter(item => item !== '');
}

function getQuantityByCode(data, targetCode) {
    for (let item of data.codes) {
        if (item.code === targetCode) {
            return item.quantity;
        }
    }
    return null; 
}

function getGuidCategoryList() {
    var productsContainer = document.querySelector('.products');
    if (productsContainer) {
        var products = productsContainer.querySelectorAll('.product .p[data-micro="product"]');
        var productList = Array.from(products).map(product => product.getAttribute('data-micro-identifier'));
        return productList;
    } else {
        console.log("Nenalezen kontejner s třídou .products");
    }
}

function getActiveFilterValuesWithSection() {
    var combinedValues = [];
    var filterSections = document.querySelectorAll('.filter-section');

    Array.from(filterSections).forEach(section => {
        if (section.querySelector('.active')) {
            var sectionTitle = section.querySelector('h4').textContent.trim();
            var activeElements = section.querySelectorAll('.active');
            Array.from(activeElements).forEach(activeElement => {
        
                var activeText = activeElement.textContent.replace(activeElement.querySelector('.filter-count').textContent, '').trim();
                combinedValues.push(`${sectionTitle}=${activeText}`);
            });
        }
    });

    var result = combinedValues.join(',');
    return result;
}

function getActiveSorting() {
    var activeRadioButton = document.querySelector('form[action="/action/ProductsListing/sortProducts/"] input[type="radio"]:checked');

    if (activeRadioButton) {
        var label = document.querySelector(`label[for="${activeRadioButton.id}"]`);        
        return label.textContent;
    } else {
        return null;
    }
}

document.addEventListener('click', function(event) {
    var pageType = dataHelper.get('shoptet.pageType'); 

    if (pageType === "productDetail") {
        if (event.target.matches('a.add-to-cart-button')) {
            lastClickedButtonType = "Upsell product page";
            lastClickedButtonCopy = "+";
        } else if (event.target.matches('button[data-product-code][data-action="buy"].add-to-cart-button')) {
            lastClickedButtonType = "LB recommend";
            lastClickedButtonCopy = event.target.innerText;
        } else if (event.target.matches('button.btn-lg[data-testid="addToCart"].add-to-cart-button')) {
            lastClickedButtonType = "Main btn product page";
            lastClickedButtonCopy = event.target.innerText;
        }
    } else if (pageType === "category" && event.target.matches('button.add-to-cart-category')) {
        lastClickedButtonType = "Category page btn";
            lastClickedButtonCopy = event.target.innerText;
    }

    if (event.target.matches('[data-testid="increase"], [data-testid="decrease"]')) {
        lastClickedButtonType = "Quantity btn";
        lastClickedButtonCopy = "Arrow";
    }
});

window.addEventListener('load', function() {

    var pageType = dataHelper.get('shoptet.pageType'); 
    if (pageType != "productDetail") 
        return;

    function sendItemToExponea() {

        var dataHelperShoptetData = dataHelper.get('shoptet');
        var product = dataHelperShoptetData.product;
        var shoptetData = getShoptetDataLayer();
    
        var manufacturer, url, GUID, VATvalue, flags, standardPrice, czkRate;
    
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://app.krasnevune.cz/convertor-v4/dev/vune.php?stat=cz&kod=' + productData.content_ids[0], false);
        xhr.send();
    
        if (xhr.status === 200) {
            var data = JSON.parse(xhr.responseText);
            manufacturer = data.Manufacturer;
            GUID = data.GUID;
            url = data.Url;
            VATvalue = data.VAT;
            flags = data.Flags;
            standardPrice = data.StandardPrice;
            czkRate = data.CZKRate;
        } else {
            console.error('Chyba při načítání dat:', xhr.statusText);
        }
    
        var flagsList = (flags && flags.trim() !== "") ? convertString(flags) : undefined;
        var productQantity = getQuantityByCode(product, productData.content_ids[0]);
    
        var priceExcludingVAT = productData.valueWoVat;
        var priceEurExcludingVAT = parseFloat((productData.valueWoVat / czkRate).toFixed(2));
        var standardPriceExcludingVAT = standardPrice ? parseFloat((standardPrice / (1 + (VATvalue / 100))).toFixed(2)) : 0;
        var standardPriceEurExcludingVAT = standardPrice ? parseFloat((standardPriceExcludingVAT / czkRate).toFixed(2)) : 0;
        var priceLocalCurrency = parseFloat(priceExcludingVAT.toFixed(2));
        var discountPercentage = standardPrice ? parseFloat(((standardPriceExcludingVAT - priceExcludingVAT) / standardPriceExcludingVAT * 100).toFixed(2)) : 0;
        var discountValue = standardPriceEurExcludingVAT ? parseFloat((standardPriceEurExcludingVAT - priceEurExcludingVAT).toFixed(2)) : 0;
        var originalPrice = standardPriceEurExcludingVAT ? standardPriceEurExcludingVAT : priceEurExcludingVAT;
        var originalPriceLocalCurrency = standardPriceExcludingVAT ? parseFloat(standardPriceExcludingVAT.toFixed(2)) : priceExcludingVAT;
    
        var viewItemEvent = {
            'product_id': product.guid,
            'variant_id': productData.content_ids[0],
            'title': product.name,
            'price': priceEurExcludingVAT,
            'price_local_currency': priceExcludingVAT,
            'original_price': originalPrice,
            'original_price_local_currency': originalPriceLocalCurrency,
            'discount_percentage': discountPercentage,
            'discount_value': discountValue,
            'brand': manufacturer,
            'tags': flagsList,
            'category_level_1': productData.content_category.split(' / ')[0],
            'category_level_2': productData.content_category.split(' / ')[1],
            'category_level_3': productData.content_category.split(' / ')[2],
            'category_id': product.currentCategoryGuid,
            'categories_ids': [product.currentCategoryGuid],
            'categories_path': productData.content_category,
            'location': window.location.href,
            'local_currency': shoptetData.currency,
            'domain': window.location.hostname,
            'language': shoptetData.language,
            'stock_level': productQantity
        };
    
        exponea.track('view_item', viewItemEvent);
    }    
    
    let isFunctionTriggered = false;
    document.addEventListener("ShoptetSurchargesPriceUpdated", function() {
        if (!isFunctionTriggered) {
            isFunctionTriggered = true;
            
            setTimeout(function() {
                sendItemToExponea()
                isFunctionTriggered = false;
            }, 750);
        }
    });
    
});

window.addEventListener('load', function() {
    var shoptetData = getShoptetDataLayer();
    var dataHelper = new DataLayerHelper(dataLayer);
    var cartInfoItems = getShoptetDataLayer('cart');
    var cartItems = getShoptetDataLayer('cartInfo').cartItems;
    var cartInfoDiscount = getShoptetDataLayer('cartInfo').discountCoupon;
  	var pageType = dataHelper.get('shoptet.pageType'); 
		var getNoBillingInfo = getShoptetDataLayer('cartInfo').getNoBillingShippingPrice;	
  	var leftToFreeShipping = getShoptetDataLayer('cartInfo').leftToFreeShipping.priceLeft;
  
  	if (pageType != "customerDetails") 
        return;
  
    var productList = cartItems.map(product => {
        return {
            product_id: getShoptetProductsList()[product.priceId]?.guid || null,
            quantity: product.quantity
        };
    });

    var productIds = cartInfoItems.map(product => getShoptetProductsList()[product.priceId]?.guid || null);
    var variantList = cartInfoItems.map(product => {
        return {
            variant_id: product.code,
            quantity: product.quantity
        };
    });

    var variantIds = cartInfoItems.map(product => product.code);
    var totalQuantity = cartInfoItems.reduce((sum, product) => sum + product.quantity, 0);

		var parentShippingPayment = $('.order-summary-item.helper').next();
		
		var shippingElement = parentShippingPayment.find('[data-testid="recapDeliveryMethod"]');
		var paymentElement = parentShippingPayment.find('[data-testid="recapPaymentMethod"]');

		var paymentName = paymentElement.clone().children().remove().end().text().trim();
		var paymentCost = paymentElement.find('[data-testid="recapItemPrice"]').text().replace('Kč', '').trim();

		var shippingName = shippingElement.clone().children().remove().end().text().trim();
		var shippingCost = shippingElement.find('[data-testid="recapItemPrice"]').text().replace('Kč', '').trim();


		var viewCustomerDetailsEvent = {
          'step_number' : 2,
          'step_title' : 'Delivery info',
          'voucher_code' : cartInfoDiscount.code,
          "location": window.location.href,
      		'shipping_company': shippingName,
          'shipping_cost': shippingCost,
          'payment_type': paymentName,
      		'payment_cost': paymentCost,
      		'free_shipping_left': leftToFreeShipping,
          "local_currency": shoptetData.currency,
          "domain": window.location.hostname,
          'language': shoptetData.language,
          "product_list": productList,
          "product_ids": productIds,
          "variant_list": variantList,
          "variant_ids": variantIds,
          "total_quantity": totalQuantity,
      		"total_price": getNoBillingInfo.withVat,
          "total_price_wo_vat": getNoBillingInfo.withoutVat,
        	"total_vat": getNoBillingInfo.vat
    }
    exponea.track('checkout', viewCustomerDetailsEvent);

});


window.addEventListener('load', function() {
    var shoptetData = getShoptetDataLayer();
    var dataHelper = new DataLayerHelper(dataLayer);
    var cartInfoItems = getShoptetDataLayer('cart');
    var cartItems = getShoptetDataLayer('cartInfo').cartItems;
    var cartInfoDiscount = getShoptetDataLayer('cartInfo').discountCoupon;
  	var pageType = dataHelper.get('shoptet.pageType'); 

  	if (pageType != "billingAndShipping")
        return;
  
    var productList = cartItems.map(product => {
        return {
            product_id: getShoptetProductsList()[product.priceId]?.guid || null,
            quantity: product.quantity
        };
    });

    var productIds = cartInfoItems.map(product => getShoptetProductsList()[product.priceId]?.guid || null);
    var variantList = cartInfoItems.map(product => {
        return {
            variant_id: product.code,
            quantity: product.quantity
        };
    });

    var variantIds = cartInfoItems.map(product => product.code);
    var totalQuantity = cartInfoItems.reduce((sum, product) => sum + product.quantity, 0);

  
		var viewCartEvent = {
          'step_number' : 1,
          'step_title' : 'Payment and Shipping',
          'voucher_code' : cartInfoDiscount.code,
          "location": window.location.href,
          "local_currency": shoptetData.currency,
          "domain": window.location.hostname,
          'language': shoptetData.language,
          "product_list": productList,
          "product_ids": productIds,
          "variant_list": variantList,
          "variant_ids": variantIds,
          "total_quantity": totalQuantity
    }
    exponea.track('checkout', viewCartEvent);
  
});





window.addEventListener('load', function() {
    var shoptetData = getShoptetDataLayer();
    var dataHelper = new DataLayerHelper(dataLayer);
    var cartInfoItems = getShoptetDataLayer('cart');
    var cartItems = getShoptetDataLayer('cartInfo').cartItems;
  	var pageType = dataHelper.get('shoptet.pageType'); 
    if (pageType != "cart") 
        return;
  
    var productList = cartItems.map(product => {
        return {
            product_id: getShoptetProductsList()[product.priceId]?.guid || null,
            quantity: product.quantity
        };
    });

    var productIds = cartInfoItems.map(product => getShoptetProductsList()[product.priceId]?.guid || null);
    var variantList = cartInfoItems.map(product => {
        return {
            variant_id: product.code,
            quantity: product.quantity
        };
    });

    var variantIds = cartInfoItems.map(product => product.code);
    var totalQuantity = cartInfoItems.reduce((sum, product) => sum + product.quantity, 0);

  
		var viewCartEvent = {
          'step_number' : 0,
          'step_title' : 'Cart',
          "location": window.location.href,
          "local_currency": shoptetData.currency,
          "domain": window.location.hostname,
          'language': shoptetData.language,
          "product_list": productList,
          "product_ids": productIds,
          "variant_list": variantList,
          "variant_ids": variantIds,
          "total_quantity": totalQuantity
    }
    exponea.track('checkout', viewCartEvent);
  
});


window.addEventListener('load', function() {

    var pageType = dataHelper.get('shoptet.pageType'); 
    if (pageType != "category") 
        return;

    function sendToExponea() {
        var shoptetData = getShoptetDataLayer();
        var dataHelperShoptetData = dataHelper.get('shoptet');
        var category = dataHelperShoptetData.category;

        var productsList = getGuidCategoryList();
        var activeFilters = getActiveFilterValuesWithSection();
        var activeSorting = getActiveSorting();

        // Vytvoření objektu pro událost 'view category'
        var viewCategoryEvent = {
            'category_id': category.guid,
            'category_name': category.path.split(' | ')[category.path.split(' | ').length - 1],
            'category_level_1': category.path.split(' | ')[0], 
            'category_level_2': category.path.split(' | ')[1],
            'category_level_3': category.path.split(' | ')[2],
            'categories_path': category.path.replace(/\|/g, "/"),
            'listed_products': productsList,
            'filter_by': activeFilters,
            'sort_by': activeSorting,
            'location': window.location.href,
            'local_currency': shoptetData.currency,
            'domain': window.location.hostname,
            'language': shoptetData.language
        };
        
        exponea.track('view_category', viewCategoryEvent);
    }
    setTimeout(function() {
        sendToExponea();
    },200);
    
    // Přidání posluchačů pro obě události
    document.addEventListener('ShoptetPagePaginationUsed', function() {setTimeout(function() {sendToExponea()}, 500)});
    document.addEventListener('ShoptetDOMPageMoreProductsLoaded', function() {setTimeout(function() {sendToExponea()}, 500)});
    document.addEventListener('ShoptetPageFilterValueChange', function() {setTimeout(function() {sendToExponea()}, 500)});
    document.addEventListener('ShoptetPageSortingChanged', function() {setTimeout(function() {sendToExponea()}, 500)});
});

document.addEventListener('ShoptetDataLayerUpdated', async function() {
    // Inicializace DataLayerHelper
    var dataHelper = new DataLayerHelper(dataLayer);
    var cartInfoItems = getShoptetDataLayer('cart');
    var cartItems = getShoptetDataLayer('cartInfo').cartItems;
    var action = "";
    var removedProduct;

    // Rozhodování na základě akce v košíku
    if (dataHelper.get('event') === "removeFromCart") {
        action = "remove";
        removedProduct = dataHelper.get('ecommerce.remove')[0];

        // Nastavení množství na 0, pokud je méně položek v košíku
        if (cartInfoItems.length < cartItems.length) {
            removedProduct.quantity = 0;
        }
    }

    async function generateCartUpdateEvent(action, productData) { 
        var manufacturer, url, GUID, VATvalue, flags, standardPrice, czkRate;
    
        try {
            const response = await fetch('https://app.krasnevune.cz/convertor-v4/dev/vune.php?stat=cz&kod=' + productData.id);
            if (response.ok) {
                const data = await response.json();
                manufacturer = data.Manufacturer;
                GUID = data.GUID;
                url = data.Url;
                VATvalue = data.VAT;
                flags = data.Flags;
                standardPrice = data.StandardPrice;
                czkRate = data.CZKRate;
            }
        } catch (error) {
            console.error('Chyba při načítání dat:', error);
        }
    
        var flagsList = (flags && flags.trim() !== "") ? convertString(flags) : undefined;

        var productList = cartItems.map(product => {
            return {
                product_id: getShoptetProductsList()[product.priceId]?.guid || null,
                quantity: product.quantity
            };
        });

        var productIds = cartInfoItems.map(product => getShoptetProductsList()[product.priceId]?.guid || null);
        var variantList = cartInfoItems.map(product => {
            return {
                variant_id: product.code,
                quantity: product.quantity
            };
        });

        var variantIds = cartInfoItems.map(product => product.code);
        var totalQuantity = cartInfoItems.reduce((sum, product) => sum + product.quantity, 0);

        // Výpočet ceny bez daně
        var priceExcludingVAT = parseFloat((productData.price / (1 + (VATvalue / 100))).toFixed(2));
        var priceEurExcludingVAT = parseFloat((priceExcludingVAT / czkRate).toFixed(2));

        // Pokud standardPrice existuje, vypočítáme cenu bez daně
        var standardPriceExcludingVAT = standardPrice ? parseFloat((standardPrice / (1 + (VATvalue / 100))).toFixed(2)) : 0;
        var standardPriceEurExcludingVAT = standardPrice ? parseFloat((standardPriceExcludingVAT / czkRate).toFixed(2)) : 0;

        // Výpočet ceny v místní měně
        var priceLocalCurrency = parseFloat((priceExcludingVAT).toFixed(2));

        // Výpočet slevy
        var discountPercentage = standardPrice ? parseFloat(((standardPrice - productData.price) / standardPrice * 100).toFixed(2)) : 0;
        var discountValue = standardPriceEurExcludingVAT ? parseFloat((standardPriceEurExcludingVAT - priceEurExcludingVAT).toFixed(2)) : 0;

        // Výpočet původní ceny a původní ceny v místní měně
        var originalPrice = priceEurExcludingVAT;
        var originalPriceLocalCurrency = parseFloat((priceExcludingVAT).toFixed(2));

        // Výpočet celkové ceny košíku s DPH v EURO
        var totalPrice = parseFloat(cartInfoItems.reduce((sum, item) => sum + (parseFloat(item.priceWithVat) * item.quantity), 0) / czkRate).toFixed(2);

        // Výpočet celkové ceny košíku bez DPH v EURO
        var totalPriceWithoutTax = parseFloat(cartInfoItems.reduce((sum, item) => {
            var priceWithoutVAT = (parseFloat(item.priceWithVat) / (1 + (VATvalue / 100))) * item.quantity;
            return sum + priceWithoutVAT;
        }, 0) / czkRate).toFixed(2);

        // Výpočet celkové ceny košíku v místní měně
        var totalPriceLocalCurrency = cartInfoItems.reduce((sum, item) => sum + (parseFloat(item.priceWithVat) * item.quantity), 0);


        return {
            "action": action,
            "page_type": dataHelper.get('shoptet.pageType'),
            "product_id": GUID,
            "button_type": lastClickedButtonType,
            "button_copy": lastClickedButtonCopy,
            "variant_id": productData.id,
            "title": productData.name,
            "brand": manufacturer,
            "tags": flagsList,
            "category_level_1": productData.category.split(' / ')[0],
            "category_level_2": productData.category.split(' / ')[1],
            "category_level_3": productData.category.split(' / ')[2],
            "categories_path": productData.category,
            "quantity": productData.quantity,
            "location": window.location.href,
            "local_currency": dataHelper.get('ecommerce.currencyCode'),
            "domain": window.location.hostname,
            "language": dataHelper.get('shoptet.language'),
            "product_list": productList,
            "product_ids": productIds,
            "variant_list": variantList,
            "variant_ids": variantIds,
            "price": priceEurExcludingVAT,
            "price_local_currency": priceLocalCurrency,
            "discount_percentage": discountPercentage,
            "discount_value": discountValue,
            "original_price": originalPrice,
            "original_price_local_currency": originalPriceLocalCurrency,
            "total_quantity": totalQuantity,
            "total_price": totalPrice,
            "total_price_without_tax": totalPriceWithoutTax,
            "total_price_local_currency": totalPriceLocalCurrency
        };
    }
    var lastAction = dataHelper.get('event');

    if (lastAction === "addToCart" && dataHelper.get('ecommerce.add')) {
        var addEventData = await generateCartUpdateEvent("add", dataHelper.get('ecommerce.add')[0]); // Přidáno await
        console.log(addEventData);
        exponea.track("cart_update", addEventData);
    } else if (action === "remove") {
        var removeEventData = await generateCartUpdateEvent("remove", removedProduct); // Přidáno await
        console.log(removeEventData);
        exponea.track("cart_update", removeEventData);
    }
});

