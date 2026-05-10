-- Phase 3: Entity Refinement (Financials & Intelligence)

ALTER TABLE public.businesses ADD COLUMN total_contract_value NUMERIC(10, 2) DEFAULT 0.00;
ALTER TABLE public.businesses ADD COLUMN target_hourly_rate NUMERIC(10, 2) DEFAULT 150.00; -- Default agency rate
ALTER TABLE public.businesses ADD COLUMN health_status TEXT DEFAULT 'green'; -- 'green', 'yellow', 'red'
