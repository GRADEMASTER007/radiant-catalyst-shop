export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      african_countries: {
        Row: {
          code: string
          created_at: string
          flag_emoji: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          flag_emoji?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          flag_emoji?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      ai_model_config: {
        Row: {
          created_at: string
          description: string | null
          function_type: string
          id: string
          is_active: boolean | null
          model_id: string
          model_name: string
          provider: string
          serpapi_max_calls: number | null
          tools_enabled_serpapi: boolean | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          function_type: string
          id?: string
          is_active?: boolean | null
          model_id: string
          model_name: string
          provider?: string
          serpapi_max_calls?: number | null
          tools_enabled_serpapi?: boolean | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          function_type?: string
          id?: string
          is_active?: boolean | null
          model_id?: string
          model_name?: string
          provider?: string
          serpapi_max_calls?: number | null
          tools_enabled_serpapi?: boolean | null
          updated_at?: string
        }
        Relationships: []
      }
      ai_provider_config: {
        Row: {
          auth_header: string | null
          auth_type: string
          base_url: string
          created_at: string
          daily_credit_limit: number | null
          display_name: string
          id: string
          is_active: boolean
          priority: number
          provider_name: string
          rate_limit_per_minute: number | null
          settings: Json | null
          updated_at: string
        }
        Insert: {
          auth_header?: string | null
          auth_type?: string
          base_url: string
          created_at?: string
          daily_credit_limit?: number | null
          display_name: string
          id?: string
          is_active?: boolean
          priority?: number
          provider_name: string
          rate_limit_per_minute?: number | null
          settings?: Json | null
          updated_at?: string
        }
        Update: {
          auth_header?: string | null
          auth_type?: string
          base_url?: string
          created_at?: string
          daily_credit_limit?: number | null
          display_name?: string
          id?: string
          is_active?: boolean
          priority?: number
          provider_name?: string
          rate_limit_per_minute?: number | null
          settings?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      ai_usage_log: {
        Row: {
          completion_tokens: number | null
          cost_estimate: number | null
          created_at: string
          error_message: string | null
          function_type: string
          id: string
          model_id: string
          prompt_tokens: number | null
          provider_name: string
          response_time_ms: number | null
          success: boolean
          total_tokens: number | null
          user_id: string | null
        }
        Insert: {
          completion_tokens?: number | null
          cost_estimate?: number | null
          created_at?: string
          error_message?: string | null
          function_type: string
          id?: string
          model_id: string
          prompt_tokens?: number | null
          provider_name: string
          response_time_ms?: number | null
          success?: boolean
          total_tokens?: number | null
          user_id?: string | null
        }
        Update: {
          completion_tokens?: number | null
          cost_estimate?: number | null
          created_at?: string
          error_message?: string | null
          function_type?: string
          id?: string
          model_id?: string
          prompt_tokens?: number | null
          provider_name?: string
          response_time_ms?: number | null
          success?: boolean
          total_tokens?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      api_keys_vault: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          key_name: string
          key_value: string
          last_used_at: string | null
          service_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          key_name: string
          key_value: string
          last_used_at?: string | null
          service_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          key_name?: string
          key_value?: string
          last_used_at?: string | null
          service_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          author_name: string | null
          category: string | null
          content: string
          created_at: string
          excerpt: string | null
          featured_image_url: string | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          read_time_minutes: number | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          category?: string | null
          content: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          read_time_minutes?: number | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          category?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          read_time_minutes?: number | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: []
      }
      business_listings: {
        Row: {
          address: string | null
          business_name: string
          category: string
          city_id: string | null
          country_id: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          email: string | null
          gallery_images: Json | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          is_verified: boolean | null
          logo_url: string | null
          management_team: Json | null
          operating_hours: Json | null
          phone: string | null
          province_id: string | null
          services: string[] | null
          slug: string
          social_links: Json | null
          subscription_expires_at: string | null
          subscription_status: string | null
          updated_at: string
          user_id: string | null
          view_count: number | null
          website: string | null
        }
        Insert: {
          address?: string | null
          business_name: string
          category: string
          city_id?: string | null
          country_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          gallery_images?: Json | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          management_team?: Json | null
          operating_hours?: Json | null
          phone?: string | null
          province_id?: string | null
          services?: string[] | null
          slug: string
          social_links?: Json | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          updated_at?: string
          user_id?: string | null
          view_count?: number | null
          website?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string
          category?: string
          city_id?: string | null
          country_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          gallery_images?: Json | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          logo_url?: string | null
          management_team?: Json | null
          operating_hours?: Json | null
          phone?: string | null
          province_id?: string | null
          services?: string[] | null
          slug?: string
          social_links?: Json | null
          subscription_expires_at?: string | null
          subscription_status?: string | null
          updated_at?: string
          user_id?: string | null
          view_count?: number | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_listings_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_listings_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "african_countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_listings_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
        ]
      }
      business_subscriptions: {
        Row: {
          amount_paid_zar: number | null
          business_id: string | null
          created_at: string
          expires_at: string | null
          id: string
          payment_reference: string | null
          plan_id: string | null
          starts_at: string | null
          status: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_paid_zar?: number | null
          business_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          payment_reference?: string | null
          plan_id?: string | null
          starts_at?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_paid_zar?: number | null
          business_id?: string | null
          created_at?: string
          expires_at?: string | null
          id?: string
          payment_reference?: string | null
          plan_id?: string | null
          starts_at?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
          items: Json | null
          session_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
          items?: Json | null
          session_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
          items?: Json | null
          session_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "carts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          parent_id: string | null
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_provider_config: {
        Row: {
          created_at: string
          feature_scope: string[] | null
          id: string
          is_active: boolean
          provider_name: string
          selected_model: string
          settings: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          feature_scope?: string[] | null
          id?: string
          is_active?: boolean
          provider_name?: string
          selected_model?: string
          settings?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          feature_scope?: string[] | null
          id?: string
          is_active?: boolean
          provider_name?: string
          selected_model?: string
          settings?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      cities: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          province_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          province_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          province_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cities_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_codes: {
        Row: {
          code: string
          created_at: string
          current_uses: number
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          min_order_amount: number | null
          starts_at: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_amount?: number | null
          starts_at?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_order_amount?: number | null
          starts_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          default_billing_address: Json | null
          default_shipping_address: Json | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_billing_address?: Json | null
          default_shipping_address?: Json | null
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_billing_address?: Json | null
          default_shipping_address?: Json | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      integration_tokens: {
        Row: {
          created_at: string
          encrypted_token: string
          id: string
          provider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          encrypted_token: string
          id?: string
          provider: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          encrypted_token?: string
          id?: string
          provider?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      knowledge_base: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          is_active: boolean
          priority: number | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          content: string
          created_at?: string
          id?: string
          is_active?: boolean
          priority?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_active?: boolean
          priority?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      menus: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          items: Json | null
          location: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          items?: Json | null
          location: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          items?: Json | null
          location?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          product_sku: string | null
          quantity: number
          total_price_zar: number
          unit_price_zar: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          product_sku?: string | null
          quantity: number
          total_price_zar: number
          unit_price_zar: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          product_sku?: string | null
          quantity?: number
          total_price_zar?: number
          unit_price_zar?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          access_token: string | null
          billing_address: Json | null
          coupon_code: string | null
          coupon_discount_zar: number | null
          created_at: string
          currency: string | null
          customer_id: string | null
          delivered_at: string | null
          discount_zar: number | null
          guest_email: string | null
          id: string
          notes: string | null
          order_number: string
          payment_method: string | null
          payment_reference: string | null
          payment_status: string
          rooting_status: string | null
          shipped_at: string | null
          shipping_address: Json | null
          shipping_cost_zar: number | null
          shipping_method: string | null
          status: string
          subtotal_zar: number
          tax_zar: number | null
          total_zar: number
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          access_token?: string | null
          billing_address?: Json | null
          coupon_code?: string | null
          coupon_discount_zar?: number | null
          created_at?: string
          currency?: string | null
          customer_id?: string | null
          delivered_at?: string | null
          discount_zar?: number | null
          guest_email?: string | null
          id?: string
          notes?: string | null
          order_number: string
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string
          rooting_status?: string | null
          shipped_at?: string | null
          shipping_address?: Json | null
          shipping_cost_zar?: number | null
          shipping_method?: string | null
          status?: string
          subtotal_zar: number
          tax_zar?: number | null
          total_zar: number
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string | null
          billing_address?: Json | null
          coupon_code?: string | null
          coupon_discount_zar?: number | null
          created_at?: string
          currency?: string | null
          customer_id?: string | null
          delivered_at?: string | null
          discount_zar?: number | null
          guest_email?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string
          rooting_status?: string | null
          shipped_at?: string | null
          shipping_address?: Json | null
          shipping_cost_zar?: number | null
          shipping_method?: string | null
          status?: string
          subtotal_zar?: number
          tax_zar?: number | null
          total_zar?: number
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          content: string | null
          created_at: string
          featured_image_url: string | null
          id: string
          is_published: boolean | null
          meta_description: string | null
          meta_title: string | null
          parent_id: string | null
          slug: string
          sort_order: number | null
          template: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          featured_image_url?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          parent_id?: string | null
          slug: string
          sort_order?: number | null
          template?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          created_at?: string
          featured_image_url?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
          template?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_zar: number
          created_at: string
          error_message: string | null
          id: string
          order_id: string
          payment_data: Json | null
          payment_id: string | null
          provider: string
          status: string
          transaction_id: string | null
          updated_at: string
        }
        Insert: {
          amount_zar: number
          created_at?: string
          error_message?: string | null
          id?: string
          order_id: string
          payment_data?: Json | null
          payment_id?: string | null
          provider: string
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_zar?: number
          created_at?: string
          error_message?: string | null
          id?: string
          order_id?: string
          payment_data?: Json | null
          payment_id?: string | null
          provider?: string
          status?: string
          transaction_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          allow_backorder: boolean | null
          barcode: string | null
          brand: string | null
          category_id: string | null
          compare_at_price_zar: number | null
          cost_price_zar: number | null
          created_at: string
          description: string | null
          height_cm: number | null
          hide_after_promo: boolean
          id: string
          images: Json | null
          is_active: boolean | null
          is_featured: boolean | null
          length_cm: number | null
          low_stock_threshold: number | null
          meta_description: string | null
          meta_title: string | null
          name: string
          price_zar: number
          primary_image_url: string | null
          promo_ends_at: string | null
          promo_price_zar: number | null
          promo_starts_at: string | null
          short_description: string | null
          sku: string
          slug: string
          stock_quantity: number
          tags: string[] | null
          updated_at: string
          weight_kg: number | null
          width_cm: number | null
        }
        Insert: {
          allow_backorder?: boolean | null
          barcode?: string | null
          brand?: string | null
          category_id?: string | null
          compare_at_price_zar?: number | null
          cost_price_zar?: number | null
          created_at?: string
          description?: string | null
          height_cm?: number | null
          hide_after_promo?: boolean
          id?: string
          images?: Json | null
          is_active?: boolean | null
          is_featured?: boolean | null
          length_cm?: number | null
          low_stock_threshold?: number | null
          meta_description?: string | null
          meta_title?: string | null
          name: string
          price_zar: number
          primary_image_url?: string | null
          promo_ends_at?: string | null
          promo_price_zar?: number | null
          promo_starts_at?: string | null
          short_description?: string | null
          sku: string
          slug: string
          stock_quantity?: number
          tags?: string[] | null
          updated_at?: string
          weight_kg?: number | null
          width_cm?: number | null
        }
        Update: {
          allow_backorder?: boolean | null
          barcode?: string | null
          brand?: string | null
          category_id?: string | null
          compare_at_price_zar?: number | null
          cost_price_zar?: number | null
          created_at?: string
          description?: string | null
          height_cm?: number | null
          hide_after_promo?: boolean
          id?: string
          images?: Json | null
          is_active?: boolean | null
          is_featured?: boolean | null
          length_cm?: number | null
          low_stock_threshold?: number | null
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          price_zar?: number
          primary_image_url?: string | null
          promo_ends_at?: string | null
          promo_price_zar?: number | null
          promo_starts_at?: string | null
          short_description?: string | null
          sku?: string
          slug?: string
          stock_quantity?: number
          tags?: string[] | null
          updated_at?: string
          weight_kg?: number | null
          width_cm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      provinces: {
        Row: {
          code: string | null
          country_id: string | null
          created_at: string
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          code?: string | null
          country_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          code?: string | null
          country_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "provinces_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "african_countries"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_rates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          max_height_cm: number | null
          max_length_cm: number | null
          max_weight_kg: number
          max_width_cm: number | null
          price_zar: number
          provider: string
          service_code: string | null
          service_name: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_height_cm?: number | null
          max_length_cm?: number | null
          max_weight_kg: number
          max_width_cm?: number | null
          price_zar: number
          provider: string
          service_code?: string | null
          service_name: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          max_height_cm?: number | null
          max_length_cm?: number | null
          max_weight_kg?: number
          max_width_cm?: number | null
          price_zar?: number
          provider?: string
          service_code?: string | null
          service_name?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string | null
          duration_months: number
          features: Json | null
          id: string
          is_active: boolean | null
          name: string
          price_zar: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_months?: number
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          price_zar?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_months?: number
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          price_zar?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_contacts: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          notes: string | null
          phone_number: string | null
          tags: string[] | null
          updated_at: string | null
          wa_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          phone_number?: string | null
          tags?: string[] | null
          updated_at?: string | null
          wa_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          phone_number?: string | null
          tags?: string[] | null
          updated_at?: string | null
          wa_id?: string
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          created_at: string | null
          direction: string
          from_number: string
          id: string
          message_content: string | null
          message_type: string
          raw_payload: Json | null
          status: string | null
          status_timestamp: string | null
          timestamp: string | null
          to_number: string | null
          wa_message_id: string | null
        }
        Insert: {
          created_at?: string | null
          direction: string
          from_number: string
          id?: string
          message_content?: string | null
          message_type?: string
          raw_payload?: Json | null
          status?: string | null
          status_timestamp?: string | null
          timestamp?: string | null
          to_number?: string | null
          wa_message_id?: string | null
        }
        Update: {
          created_at?: string | null
          direction?: string
          from_number?: string
          id?: string
          message_content?: string | null
          message_type?: string
          raw_payload?: Json | null
          status?: string | null
          status_timestamp?: string | null
          timestamp?: string | null
          to_number?: string | null
          wa_message_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
