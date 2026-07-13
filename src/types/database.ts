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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      addresses: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          country: string
          created_at: string
          customer_id: string | null
          email: string | null
          full_name: string
          id: string
          landmark: string | null
          phone: string
          postal_code: string
          state: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          country?: string
          created_at?: string
          customer_id?: string | null
          email?: string | null
          full_name: string
          id?: string
          landmark?: string | null
          phone: string
          postal_code: string
          state: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          country?: string
          created_at?: string
          customer_id?: string | null
          email?: string | null
          full_name?: string
          id?: string
          landmark?: string | null
          phone?: string
          postal_code?: string
          state?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_audit_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_mutation_idempotency: {
        Row: {
          admin_id: string
          created_at: string
          idempotency_key: string
          mutation_type: string
          payload_hash: string | null
          result: Json | null
        }
        Insert: {
          admin_id: string
          created_at?: string
          idempotency_key: string
          mutation_type: string
          payload_hash?: string | null
          result?: Json | null
        }
        Update: {
          admin_id?: string
          created_at?: string
          idempotency_key?: string
          mutation_type?: string
          payload_hash?: string | null
          result?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_mutation_idempotency_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          is_active: boolean
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          is_active?: boolean
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      cart_idempotency_keys: {
        Row: {
          created_at: string
          idempotency_key: string
          operation_hash: string
          result: Json
          session_token: string
        }
        Insert: {
          created_at?: string
          idempotency_key: string
          operation_hash: string
          result: Json
          session_token: string
        }
        Update: {
          created_at?: string
          idempotency_key?: string
          operation_hash?: string
          result?: Json
          session_token?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_idempotency_keys_session_token_fkey"
            columns: ["session_token"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["session_token"]
          },
        ]
      }
      cart_items: {
        Row: {
          cart_id: string
          created_at: string
          id: string
          quantity: number
          updated_at: string
          variant_id: string
        }
        Insert: {
          cart_id: string
          created_at?: string
          id?: string
          quantity: number
          updated_at?: string
          variant_id: string
        }
        Update: {
          cart_id?: string
          created_at?: string
          id?: string
          quantity?: number
          updated_at?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
          session_token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
          session_token: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
          session_token?: string
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
          is_active: boolean
          name: string
          seo_description: string | null
          seo_title: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
        }
        Relationships: []
      }
      inventory_transactions: {
        Row: {
          change_quantity: number
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          reason: Database["public"]["Enums"]["inventory_reason"]
          reference_id: string | null
          reference_type: string | null
          variant_id: string
        }
        Insert: {
          change_quantity: number
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          reason: Database["public"]["Enums"]["inventory_reason"]
          reference_id?: string | null
          reference_type?: string | null
          variant_id: string
        }
        Update: {
          change_quantity?: number
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          reason?: Database["public"]["Enums"]["inventory_reason"]
          reference_id?: string | null
          reference_type?: string | null
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      order_idempotency_keys: {
        Row: {
          created_at: string
          idempotency_key: string
          operation: string
          order_id: string | null
          order_number: string | null
          payload_hash: string
          result: Json
          session_token: string
          status: string | null
          total_paise: number | null
        }
        Insert: {
          created_at?: string
          idempotency_key: string
          operation: string
          order_id?: string | null
          order_number?: string | null
          payload_hash: string
          result: Json
          session_token: string
          status?: string | null
          total_paise?: number | null
        }
        Update: {
          created_at?: string
          idempotency_key?: string
          operation?: string
          order_id?: string | null
          order_number?: string | null
          payload_hash?: string
          result?: Json
          session_token?: string
          status?: string | null
          total_paise?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_idempotency_keys_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          colour_snapshot: string | null
          created_at: string
          id: string
          line_total_paise: number
          order_id: string
          product_id: string | null
          product_image_snapshot: string | null
          product_name_snapshot: string
          product_slug_snapshot: string
          quantity: number
          size_snapshot: string | null
          sku_snapshot: string
          unit_price_paise_snapshot: number
          variant_id: string | null
        }
        Insert: {
          colour_snapshot?: string | null
          created_at?: string
          id?: string
          line_total_paise: number
          order_id: string
          product_id?: string | null
          product_image_snapshot?: string | null
          product_name_snapshot: string
          product_slug_snapshot: string
          quantity: number
          size_snapshot?: string | null
          sku_snapshot: string
          unit_price_paise_snapshot: number
          variant_id?: string | null
        }
        Update: {
          colour_snapshot?: string | null
          created_at?: string
          id?: string
          line_total_paise?: number
          order_id?: string
          product_id?: string | null
          product_image_snapshot?: string | null
          product_name_snapshot?: string
          product_slug_snapshot?: string
          quantity?: number
          size_snapshot?: string | null
          sku_snapshot?: string
          unit_price_paise_snapshot?: number
          variant_id?: string | null
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
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address_id: string
          created_at: string
          customer_id: string | null
          discount_paise: number
          id: string
          notes: string | null
          order_number: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          shipping_paise: number
          status: Database["public"]["Enums"]["order_status"]
          subtotal_paise: number
          total_paise: number
          updated_at: string
        }
        Insert: {
          address_id: string
          created_at?: string
          customer_id?: string | null
          discount_paise?: number
          id?: string
          notes?: string | null
          order_number?: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          shipping_paise?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_paise: number
          total_paise: number
          updated_at?: string
        }
        Update: {
          address_id?: string
          created_at?: string
          customer_id?: string | null
          discount_paise?: number
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          shipping_paise?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal_paise?: number
          total_paise?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_paise: number
          created_at: string
          id: string
          order_id: string
          provider: Database["public"]["Enums"]["payment_method"]
          raw_event_ref: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
        }
        Insert: {
          amount_paise: number
          created_at?: string
          id?: string
          order_id: string
          provider: Database["public"]["Enums"]["payment_method"]
          raw_event_ref?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Update: {
          amount_paise?: number
          created_at?: string
          id?: string
          order_id?: string
          provider?: Database["public"]["Enums"]["payment_method"]
          raw_event_ref?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_raw_event_ref_fkey"
            columns: ["raw_event_ref"]
            isOneToOne: false
            referencedRelation: "webhook_events"
            referencedColumns: ["id"]
          },
        ]
      }
      product_image_upload_intents: {
        Row: {
          admin_id: string
          created_at: string
          created_image_id: string | null
          declared_mime_type: string
          declared_size_bytes: number
          expires_at: string
          finalized_at: string | null
          id: string
          object_path: string
          product_id: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          created_image_id?: string | null
          declared_mime_type: string
          declared_size_bytes: number
          expires_at: string
          finalized_at?: string | null
          id?: string
          object_path: string
          product_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          created_image_id?: string | null
          declared_mime_type?: string
          declared_size_bytes?: number
          expires_at?: string
          finalized_at?: string | null
          id?: string
          object_path?: string
          product_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_image_upload_intents_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admin_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_image_upload_intents_created_image_id_fkey"
            columns: ["created_image_id"]
            isOneToOne: false
            referencedRelation: "product_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_image_upload_intents_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          is_primary: boolean
          product_id: string
          sort_order: number
          storage_path: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          product_id: string
          sort_order?: number
          storage_path: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          product_id?: string
          sort_order?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_option_values: {
        Row: {
          created_at: string
          id: string
          product_option_id: string
          sort_order: number
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_option_id: string
          sort_order?: number
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          product_option_id?: string
          sort_order?: number
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_option_values_product_option_id_fkey"
            columns: ["product_option_id"]
            isOneToOne: false
            referencedRelation: "product_options"
            referencedColumns: ["id"]
          },
        ]
      }
      product_options: {
        Row: {
          created_at: string
          id: string
          name: string
          product_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          product_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_options_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          created_at: string
          id: string
          image_id: string | null
          is_active: boolean
          price_adjustment_paise: number
          product_id: string
          sku: string
          stock_quantity: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_id?: string | null
          is_active?: boolean
          price_adjustment_paise?: number
          product_id: string
          sku: string
          stock_quantity?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_id?: string | null
          is_active?: boolean
          price_adjustment_paise?: number
          product_id?: string
          sku?: string
          stock_quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "product_images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_price_paise: number
          care_instructions: string | null
          category_id: string
          compare_at_price_paise: number | null
          created_at: string
          description: string | null
          fabric: string | null
          fit_info: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          is_new_arrival: boolean
          name: string
          seo_description: string | null
          seo_title: string | null
          short_description: string | null
          size_chart: Json | null
          slug: string
          updated_at: string
        }
        Insert: {
          base_price_paise: number
          care_instructions?: string | null
          category_id: string
          compare_at_price_paise?: number | null
          created_at?: string
          description?: string | null
          fabric?: string | null
          fit_info?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_new_arrival?: boolean
          name: string
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          size_chart?: Json | null
          slug: string
          updated_at?: string
        }
        Update: {
          base_price_paise?: number
          care_instructions?: string | null
          category_id?: string
          compare_at_price_paise?: number | null
          created_at?: string
          description?: string | null
          fabric?: string | null
          fit_info?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          is_new_arrival?: boolean
          name?: string
          seo_description?: string | null
          seo_title?: string | null
          short_description?: string | null
          size_chart?: Json | null
          slug?: string
          updated_at?: string
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
      shipments: {
        Row: {
          courier_name: string | null
          created_at: string
          delivered_at: string | null
          id: string
          order_id: string
          provider: Database["public"]["Enums"]["shipment_provider"]
          shipped_at: string | null
          status: string
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string
        }
        Insert: {
          courier_name?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          order_id: string
          provider?: Database["public"]["Enums"]["shipment_provider"]
          shipped_at?: string | null
          status?: string
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
        }
        Update: {
          courier_name?: string | null
          created_at?: string
          delivered_at?: string | null
          id?: string
          order_id?: string
          provider?: Database["public"]["Enums"]["shipment_provider"]
          shipped_at?: string | null
          status?: string
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      storage_cleanup_jobs: {
        Row: {
          attempts: number
          bucket_name: string
          completed_at: string | null
          created_at: string
          id: string
          last_error: string | null
          next_attempt_at: string
          object_path: string
          product_id: string | null
          source_image_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          bucket_name: string
          completed_at?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          next_attempt_at?: string
          object_path: string
          product_id?: string | null
          source_image_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          bucket_name?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          next_attempt_at?: string
          object_path?: string
          product_id?: string | null
          source_image_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      variant_option_values: {
        Row: {
          option_value_id: string
          variant_id: string
        }
        Insert: {
          option_value_id: string
          variant_id: string
        }
        Update: {
          option_value_id?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "variant_option_values_option_value_id_fkey"
            columns: ["option_value_id"]
            isOneToOne: false
            referencedRelation: "product_option_values"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "variant_option_values_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          created_at: string
          event_id: string
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          provider: string
        }
        Insert: {
          created_at?: string
          event_id: string
          event_type: string
          id?: string
          payload: Json
          processed_at?: string | null
          provider?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          provider?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_store_settings: {
        Row: {
          key: string | null
          value: Json | null
        }
        Insert: {
          key?: string | null
          value?: Json | null
        }
        Update: {
          key?: string | null
          value?: Json | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_cod_order_atomic: {
        Args: {
          p_address_line1: string
          p_address_line2: string
          p_city: string
          p_email: string
          p_idempotency_key: string
          p_landmark: string
          p_name: string
          p_notes: string
          p_payload_hash: string
          p_phone: string
          p_postal_code: string
          p_session_token: string
          p_state: string
        }
        Returns: Json
      }
      create_product_image_upload_intent: {
        Args: {
          p_declared_mime_type: string
          p_declared_size_bytes: number
          p_idempotency_key: string
          p_product_id: string
        }
        Returns: {
          expires_at: string
          intent_id: string
          object_path: string
        }[]
      }
      delete_product_image_transaction: {
        Args: { p_idempotency_key: string; p_image_id: string }
        Returns: string
      }
      finalize_product_image_upload: {
        Args: {
          p_admin_id: string
          p_alt_text: string
          p_height: number
          p_idempotency_key: string
          p_intent_id: string
          p_make_primary: boolean
          p_validated_mime_type: string
          p_validated_size_bytes: number
          p_width: number
        }
        Returns: string
      }
      is_active_admin: { Args: never; Returns: boolean }
      manual_adjust_variant_stock: {
        Args: {
          p_change_quantity: number
          p_idempotency_key: string
          p_note: string
          p_variant_id: string
        }
        Returns: {
          new_stock: number
          transaction_id: string
        }[]
      }
      release_variant_stock: {
        Args: {
          p_note?: string
          p_quantity: number
          p_reference_id?: string
          p_variant_id: string
        }
        Returns: number
      }
      reserve_variant_stock: {
        Args: {
          p_note?: string
          p_quantity: number
          p_reference_id?: string
          p_variant_id: string
        }
        Returns: number
      }
      save_category_transaction: {
        Args: {
          p_category_id: string
          p_expected_updated_at: string
          p_idempotency_key: string
          p_payload: Json
          p_payload_version: number
        }
        Returns: Json
      }
      save_product_tree: {
        Args: {
          p_expected_updated_at: string
          p_idempotency_key: string
          p_payload: Json
          p_payload_version: number
          p_product_id: string
        }
        Returns: Json
      }
      update_product_images_transaction: {
        Args: {
          p_expected_product_updated_at: string
          p_idempotency_key: string
          p_payload: Json
          p_payload_version: number
          p_product_id: string
        }
        Returns: Json
      }
      upsert_cart_item_atomic: {
        Args: {
          p_idempotency_key: string
          p_quantity: number
          p_session_token: string
          p_variant_id: string
        }
        Returns: Json
      }
    }
    Enums: {
      inventory_reason:
        | "initial_stock"
        | "manual_adjustment"
        | "order_reservation"
        | "order_completed"
        | "order_cancellation"
        | "return"
        | "damaged_item"
      order_status:
        | "PENDING_PAYMENT"
        | "PENDING_CONFIRMATION"
        | "CONFIRMED"
        | "PROCESSING"
        | "PACKED"
        | "SHIPPED"
        | "DELIVERED"
        | "CANCELLED"
        | "PAYMENT_FAILED"
        | "RETURN_REQUESTED"
        | "RETURNED"
      payment_method: "razorpay" | "cod"
      payment_status:
        | "created"
        | "authorized"
        | "captured"
        | "failed"
        | "refunded"
      shipment_provider: "manual" | "shiprocket"
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
      inventory_reason: [
        "initial_stock",
        "manual_adjustment",
        "order_reservation",
        "order_completed",
        "order_cancellation",
        "return",
        "damaged_item",
      ],
      order_status: [
        "PENDING_PAYMENT",
        "PENDING_CONFIRMATION",
        "CONFIRMED",
        "PROCESSING",
        "PACKED",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
        "PAYMENT_FAILED",
        "RETURN_REQUESTED",
        "RETURNED",
      ],
      payment_method: ["razorpay", "cod"],
      payment_status: [
        "created",
        "authorized",
        "captured",
        "failed",
        "refunded",
      ],
      shipment_provider: ["manual", "shiprocket"],
    },
  },
} as const
