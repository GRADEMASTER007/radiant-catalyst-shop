UPDATE public.orders
   SET status = 'pending',
       payment_status = 'pending',
       payment_reference = NULL,
       payment_method = NULL,
       updated_at = now()
 WHERE id = '8763f56d-033d-4c38-aef5-b89875d646aa';

DELETE FROM public.payments
 WHERE order_id = '8763f56d-033d-4c38-aef5-b89875d646aa'
   AND payment_id LIKE 'p_test_%';

UPDATE public.products
   SET stock_quantity = 10, updated_at = now()
 WHERE id = '843feebd-98cc-4cfe-82ab-77ceec43e3d4';