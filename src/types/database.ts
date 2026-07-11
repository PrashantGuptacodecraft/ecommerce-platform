/**
 * Database types for the Supabase `public` schema.
 *
 * SOURCE OF TRUTH: the SQL migrations in `supabase/migrations/*.sql`.
 *
 * This file is normally GENERATED from the live database:
 *
 *   supabase gen types typescript --linked --schema public > src/types/database.ts
 *   # (or: --project-id <ref>)
 *
 * Because the Supabase project is an external setup step and does not exist at
 * this milestone, it is hand-authored to match the migrations exactly. Once the
 * project is created, regenerate it with the command above and keep it in sync
 * with any new migration. See docs/DECISIONS.md (#15).
 *
 * Conventions: uuid → string, timestamptz → string (ISO), integer paise →
 * number, jsonb → Json, enums → string-literal unions.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      admin_profiles: {
        Row: {
          id: string
          full_name: string | null
          role: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          role?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          role?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          image_url: string | null
          sort_order: number
          is_active: boolean
          seo_title: string | null
          seo_description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          image_url?: string | null
          sort_order?: number
          is_active?: boolean
          seo_title?: string | null
          seo_description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          image_url?: string | null
          sort_order?: number
          is_active?: boolean
          seo_title?: string | null
          seo_description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          short_description: string | null
          category_id: string
          base_price_paise: number
          compare_at_price_paise: number | null
          fabric: string | null
          care_instructions: string | null
          fit_info: string | null
          size_chart: Json | null
          is_active: boolean
          is_featured: boolean
          is_new_arrival: boolean
          seo_title: string | null
          seo_description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          short_description?: string | null
          category_id: string
          base_price_paise: number
          compare_at_price_paise?: number | null
          fabric?: string | null
          care_instructions?: string | null
          fit_info?: string | null
          size_chart?: Json | null
          is_active?: boolean
          is_featured?: boolean
          is_new_arrival?: boolean
          seo_title?: string | null
          seo_description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          short_description?: string | null
          category_id?: string
          base_price_paise?: number
          compare_at_price_paise?: number | null
          fabric?: string | null
          care_instructions?: string | null
          fit_info?: string | null
          size_chart?: Json | null
          is_active?: boolean
          is_featured?: boolean
          is_new_arrival?: boolean
          seo_title?: string | null
          seo_description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'products_category_id_fkey'
            columns: ['category_id']
            referencedRelation: 'categories'
            referencedColumns: ['id']
          },
        ]
      }
      product_images: {
        Row: {
          id: string
          product_id: string
          storage_path: string
          alt_text: string | null
          sort_order: number
          is_primary: boolean
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          storage_path: string
          alt_text?: string | null
          sort_order?: number
          is_primary?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          storage_path?: string
          alt_text?: string | null
          sort_order?: number
          is_primary?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'product_images_product_id_fkey'
            columns: ['product_id']
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
      product_options: {
        Row: {
          id: string
          product_id: string
          name: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          name: string
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          name?: string
          sort_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'product_options_product_id_fkey'
            columns: ['product_id']
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
      product_option_values: {
        Row: {
          id: string
          product_option_id: string
          value: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          product_option_id: string
          value: string
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          product_option_id?: string
          value?: string
          sort_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'product_option_values_product_option_id_fkey'
            columns: ['product_option_id']
            referencedRelation: 'product_options'
            referencedColumns: ['id']
          },
        ]
      }
      product_variants: {
        Row: {
          id: string
          product_id: string
          sku: string
          stock_quantity: number
          price_adjustment_paise: number
          is_active: boolean
          image_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          sku: string
          stock_quantity?: number
          price_adjustment_paise?: number
          is_active?: boolean
          image_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          sku?: string
          stock_quantity?: number
          price_adjustment_paise?: number
          is_active?: boolean
          image_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'product_variants_product_id_fkey'
            columns: ['product_id']
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'product_variants_image_id_fkey'
            columns: ['image_id']
            referencedRelation: 'product_images'
            referencedColumns: ['id']
          },
        ]
      }
      variant_option_values: {
        Row: {
          variant_id: string
          option_value_id: string
        }
        Insert: {
          variant_id: string
          option_value_id: string
        }
        Update: {
          variant_id?: string
          option_value_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'variant_option_values_variant_id_fkey'
            columns: ['variant_id']
            referencedRelation: 'product_variants'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'variant_option_values_option_value_id_fkey'
            columns: ['option_value_id']
            referencedRelation: 'product_option_values'
            referencedColumns: ['id']
          },
        ]
      }
      inventory_transactions: {
        Row: {
          id: string
          variant_id: string
          change_quantity: number
          reason: Database['public']['Enums']['inventory_reason']
          reference_type: string | null
          reference_id: string | null
          note: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          variant_id: string
          change_quantity: number
          reason: Database['public']['Enums']['inventory_reason']
          reference_type?: string | null
          reference_id?: string | null
          note?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          variant_id?: string
          change_quantity?: number
          reason?: Database['public']['Enums']['inventory_reason']
          reference_type?: string | null
          reference_id?: string | null
          note?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'inventory_transactions_variant_id_fkey'
            columns: ['variant_id']
            referencedRelation: 'product_variants'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'inventory_transactions_created_by_fkey'
            columns: ['created_by']
            referencedRelation: 'admin_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      customers: {
        Row: {
          id: string
          phone: string | null
          email: string | null
          full_name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          phone?: string | null
          email?: string | null
          full_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          phone?: string | null
          email?: string | null
          full_name?: string | null
          created_at?: string
        }
        Relationships: []
      }
      addresses: {
        Row: {
          id: string
          customer_id: string | null
          full_name: string
          phone: string
          email: string | null
          address_line1: string
          address_line2: string | null
          landmark: string | null
          city: string
          state: string
          postal_code: string
          country: string
          created_at: string
        }
        Insert: {
          id?: string
          customer_id?: string | null
          full_name: string
          phone: string
          email?: string | null
          address_line1: string
          address_line2?: string | null
          landmark?: string | null
          city: string
          state: string
          postal_code: string
          country?: string
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string | null
          full_name?: string
          phone?: string
          email?: string | null
          address_line1?: string
          address_line2?: string | null
          landmark?: string | null
          city?: string
          state?: string
          postal_code?: string
          country?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'addresses_customer_id_fkey'
            columns: ['customer_id']
            referencedRelation: 'customers'
            referencedColumns: ['id']
          },
        ]
      }
      carts: {
        Row: {
          id: string
          session_token: string
          customer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_token: string
          customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_token?: string
          customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'carts_customer_id_fkey'
            columns: ['customer_id']
            referencedRelation: 'customers'
            referencedColumns: ['id']
          },
        ]
      }
      cart_items: {
        Row: {
          id: string
          cart_id: string
          variant_id: string
          quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cart_id: string
          variant_id: string
          quantity: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cart_id?: string
          variant_id?: string
          quantity?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'cart_items_cart_id_fkey'
            columns: ['cart_id']
            referencedRelation: 'carts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'cart_items_variant_id_fkey'
            columns: ['variant_id']
            referencedRelation: 'product_variants'
            referencedColumns: ['id']
          },
        ]
      }
      store_settings: {
        Row: {
          key: string
          value: Json
          updated_at: string
        }
        Insert: {
          key: string
          value: Json
          updated_at?: string
        }
        Update: {
          key?: string
          value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          id: string
          provider: string
          event_id: string
          event_type: string
          payload: Json
          processed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          provider?: string
          event_id: string
          event_type: string
          payload: Json
          processed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          provider?: string
          event_id?: string
          event_type?: string
          payload?: Json
          processed_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      admin_audit_logs: {
        Row: {
          id: string
          admin_id: string | null
          action: string
          entity_type: string | null
          entity_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_id?: string | null
          action: string
          entity_type?: string | null
          entity_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          admin_id?: string | null
          action?: string
          entity_type?: string | null
          entity_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'admin_audit_logs_admin_id_fkey'
            columns: ['admin_id']
            referencedRelation: 'admin_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      orders: {
        Row: {
          id: string
          order_number: string
          customer_id: string | null
          address_id: string
          status: Database['public']['Enums']['order_status']
          payment_method: Database['public']['Enums']['payment_method']
          subtotal_paise: number
          shipping_paise: number
          discount_paise: number
          total_paise: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number?: string
          customer_id?: string | null
          address_id: string
          status?: Database['public']['Enums']['order_status']
          payment_method: Database['public']['Enums']['payment_method']
          subtotal_paise: number
          shipping_paise?: number
          discount_paise?: number
          total_paise: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_number?: string
          customer_id?: string | null
          address_id?: string
          status?: Database['public']['Enums']['order_status']
          payment_method?: Database['public']['Enums']['payment_method']
          subtotal_paise?: number
          shipping_paise?: number
          discount_paise?: number
          total_paise?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'orders_customer_id_fkey'
            columns: ['customer_id']
            referencedRelation: 'customers'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'orders_address_id_fkey'
            columns: ['address_id']
            referencedRelation: 'addresses'
            referencedColumns: ['id']
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          variant_id: string | null
          product_name_snapshot: string
          product_slug_snapshot: string
          product_image_snapshot: string | null
          sku_snapshot: string
          size_snapshot: string | null
          colour_snapshot: string | null
          unit_price_paise_snapshot: number
          quantity: number
          line_total_paise: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          variant_id?: string | null
          product_name_snapshot: string
          product_slug_snapshot: string
          product_image_snapshot?: string | null
          sku_snapshot: string
          size_snapshot?: string | null
          colour_snapshot?: string | null
          unit_price_paise_snapshot: number
          quantity: number
          line_total_paise: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          variant_id?: string | null
          product_name_snapshot?: string
          product_slug_snapshot?: string
          product_image_snapshot?: string | null
          sku_snapshot?: string
          size_snapshot?: string | null
          colour_snapshot?: string | null
          unit_price_paise_snapshot?: number
          quantity?: number
          line_total_paise?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey'
            columns: ['order_id']
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'order_items_product_id_fkey'
            columns: ['product_id']
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'order_items_variant_id_fkey'
            columns: ['variant_id']
            referencedRelation: 'product_variants'
            referencedColumns: ['id']
          },
        ]
      }
      payments: {
        Row: {
          id: string
          order_id: string
          provider: Database['public']['Enums']['payment_method']
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          status: Database['public']['Enums']['payment_status']
          amount_paise: number
          raw_event_ref: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          provider: Database['public']['Enums']['payment_method']
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: Database['public']['Enums']['payment_status']
          amount_paise: number
          raw_event_ref?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          provider?: Database['public']['Enums']['payment_method']
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          status?: Database['public']['Enums']['payment_status']
          amount_paise?: number
          raw_event_ref?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'payments_order_id_fkey'
            columns: ['order_id']
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'payments_raw_event_ref_fkey'
            columns: ['raw_event_ref']
            referencedRelation: 'webhook_events'
            referencedColumns: ['id']
          },
        ]
      }
      shipments: {
        Row: {
          id: string
          order_id: string
          provider: Database['public']['Enums']['shipment_provider']
          courier_name: string | null
          tracking_number: string | null
          tracking_url: string | null
          status: string
          shipped_at: string | null
          delivered_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          provider?: Database['public']['Enums']['shipment_provider']
          courier_name?: string | null
          tracking_number?: string | null
          tracking_url?: string | null
          status?: string
          shipped_at?: string | null
          delivered_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          provider?: Database['public']['Enums']['shipment_provider']
          courier_name?: string | null
          tracking_number?: string | null
          tracking_url?: string | null
          status?: string
          shipped_at?: string | null
          delivered_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'shipments_order_id_fkey'
            columns: ['order_id']
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      public_store_settings: {
        Row: {
          key: string | null
          value: Json | null
        }
        Relationships: []
      }
    }
    Functions: {
      is_active_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      reserve_variant_stock: {
        Args: {
          p_variant_id: string
          p_quantity: number
          p_reference_id?: string
          p_note?: string
        }
        Returns: number
      }
      release_variant_stock: {
        Args: {
          p_variant_id: string
          p_quantity: number
          p_reference_id?: string
          p_note?: string
        }
        Returns: number
      }
    }
    Enums: {
      order_status:
        | 'PENDING_PAYMENT'
        | 'PENDING_CONFIRMATION'
        | 'CONFIRMED'
        | 'PROCESSING'
        | 'PACKED'
        | 'SHIPPED'
        | 'DELIVERED'
        | 'CANCELLED'
        | 'PAYMENT_FAILED'
        | 'RETURN_REQUESTED'
        | 'RETURNED'
      payment_method: 'razorpay' | 'cod'
      payment_status: 'created' | 'authorized' | 'captured' | 'failed' | 'refunded'
      inventory_reason:
        | 'initial_stock'
        | 'manual_adjustment'
        | 'order_reservation'
        | 'order_completed'
        | 'order_cancellation'
        | 'return'
        | 'damaged_item'
      shipment_provider: 'manual' | 'shiprocket'
    }
    CompositeTypes: Record<never, never>
  }
}

// ---------------------------------------------------------------------------
// Convenience helper generics (mirror the ones supabase gen types emits).
// ---------------------------------------------------------------------------
type PublicSchema = Database['public']

export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row']
export type TablesInsert<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof PublicSchema['Tables']> =
  PublicSchema['Tables'][T]['Update']
export type Enums<T extends keyof PublicSchema['Enums']> = PublicSchema['Enums'][T]
