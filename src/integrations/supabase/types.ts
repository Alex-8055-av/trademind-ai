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
      admin_logs: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string
          details: Json
          id: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string
          details?: Json
          id?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      ai_reports: {
        Row: {
          created_at: string
          id: string
          report_json: Json
          symbol: string
          timeframe: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          report_json: Json
          symbol: string
          timeframe: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          report_json?: Json
          symbol?: string
          timeframe?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_usage_log: {
        Row: {
          completion_tokens: number | null
          cost_estimate_cents: number | null
          created_at: string
          error_message: string | null
          feature: string
          id: string
          latency_ms: number | null
          model: string
          prompt_tokens: number | null
          provider: string
          success: boolean
          user_id: string | null
        }
        Insert: {
          completion_tokens?: number | null
          cost_estimate_cents?: number | null
          created_at?: string
          error_message?: string | null
          feature: string
          id?: string
          latency_ms?: number | null
          model: string
          prompt_tokens?: number | null
          provider: string
          success?: boolean
          user_id?: string | null
        }
        Update: {
          completion_tokens?: number | null
          cost_estimate_cents?: number | null
          created_at?: string
          error_message?: string | null
          feature?: string
          id?: string
          latency_ms?: number | null
          model?: string
          prompt_tokens?: number | null
          provider?: string
          success?: boolean
          user_id?: string | null
        }
        Relationships: []
      }
      alerts: {
        Row: {
          condition_json: Json
          created_at: string
          id: string
          is_active: boolean
          kind: Database["public"]["Enums"]["alert_kind"]
          symbol: string
          triggered_at: string | null
          user_id: string
        }
        Insert: {
          condition_json?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          kind: Database["public"]["Enums"]["alert_kind"]
          symbol: string
          triggered_at?: string | null
          user_id: string
        }
        Update: {
          condition_json?: Json
          created_at?: string
          id?: string
          is_active?: boolean
          kind?: Database["public"]["Enums"]["alert_kind"]
          symbol?: string
          triggered_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      announcements: {
        Row: {
          body: string | null
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          plan_scope: string
          published_at: string
          title: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          plan_scope?: string
          published_at?: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          plan_scope?: string
          published_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          id: string
          ip: string | null
          metadata: Json
          resource_id: string | null
          resource_type: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          id?: string
          ip?: string | null
          metadata?: Json
          resource_id?: string | null
          resource_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          id?: string
          ip?: string | null
          metadata?: Json
          resource_id?: string | null
          resource_type?: string | null
        }
        Relationships: []
      }
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          discount_cents: number | null
          discount_pct: number | null
          id: string
          max_redemptions: number | null
          plan_scope: string | null
          redeemed_count: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          discount_cents?: number | null
          discount_pct?: number | null
          id?: string
          max_redemptions?: number | null
          plan_scope?: string | null
          redeemed_count?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          discount_cents?: number | null
          discount_pct?: number | null
          id?: string
          max_redemptions?: number | null
          plan_scope?: string | null
          redeemed_count?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          id: string
          key: string
          plan_min: string
          rollout_pct: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          key: string
          plan_min?: string
          rollout_pct?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          id?: string
          key?: string
          plan_min?: string
          rollout_pct?: number
          updated_at?: string
        }
        Relationships: []
      }
      holdings: {
        Row: {
          avg_price: number
          id: string
          opened_at: string
          portfolio_id: string
          qty: number
          sector: string | null
          symbol: string
          user_id: string
        }
        Insert: {
          avg_price: number
          id?: string
          opened_at?: string
          portfolio_id: string
          qty: number
          sector?: string | null
          symbol: string
          user_id: string
        }
        Update: {
          avg_price?: number
          id?: string
          opened_at?: string
          portfolio_id?: string
          qty?: number
          sector?: string | null
          symbol?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "holdings_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          id: string
          invoice_url: string | null
          issued_at: string
          paid_at: string | null
          provider: string | null
          provider_invoice_id: string | null
          status: string
          subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          id?: string
          invoice_url?: string | null
          issued_at?: string
          paid_at?: string | null
          provider?: string | null
          provider_invoice_id?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          id?: string
          invoice_url?: string | null
          issued_at?: string
          paid_at?: string | null
          provider?: string | null
          provider_invoice_id?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      market_cache: {
        Row: {
          expires_at: string
          fetched_at: string
          id: string
          kind: string
          payload: Json
          provider: string
          symbol: string
          timeframe: string
        }
        Insert: {
          expires_at: string
          fetched_at?: string
          id?: string
          kind?: string
          payload: Json
          provider: string
          symbol: string
          timeframe: string
        }
        Update: {
          expires_at?: string
          fetched_at?: string
          id?: string
          kind?: string
          payload?: Json
          provider?: string
          symbol?: string
          timeframe?: string
        }
        Relationships: []
      }
      news_items: {
        Row: {
          ai_summary: string | null
          bearish_score: number | null
          bullish_score: number | null
          created_at: string
          headline: string
          id: string
          neutral_score: number | null
          published_at: string
          raw: Json | null
          sentiment_score: number | null
          source: string
          symbol: string | null
          url: string | null
        }
        Insert: {
          ai_summary?: string | null
          bearish_score?: number | null
          bullish_score?: number | null
          created_at?: string
          headline: string
          id?: string
          neutral_score?: number | null
          published_at?: string
          raw?: Json | null
          sentiment_score?: number | null
          source: string
          symbol?: string | null
          url?: string | null
        }
        Update: {
          ai_summary?: string | null
          bearish_score?: number | null
          bullish_score?: number | null
          created_at?: string
          headline?: string
          id?: string
          neutral_score?: number | null
          published_at?: string
          raw?: Json | null
          sentiment_score?: number | null
          source?: string
          symbol?: string | null
          url?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          id: string
          invoice_id: string | null
          method: string | null
          provider: string | null
          provider_payment_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          id?: string
          invoice_id?: string | null
          method?: string | null
          provider?: string | null
          provider_payment_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          id?: string
          invoice_id?: string | null
          method?: string | null
          provider?: string | null
          provider_payment_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolios: {
        Row: {
          base_currency: string
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          base_currency?: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          base_currency?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          plan: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          plan?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          plan?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at: string | null
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          metadata: Json
          plan: string
          provider: string | null
          provider_customer_id: string | null
          provider_subscription_id: string | null
          status: string
          trial_ends_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at?: string | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json
          plan?: string
          provider?: string | null
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at?: string | null
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          metadata?: Json
          plan?: string
          provider?: string | null
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          author_id: string | null
          body: string
          created_at: string
          id: string
          is_staff: boolean
          ticket_id: string
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string
          id?: string
          is_staff?: boolean
          ticket_id: string
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string
          id?: string
          is_staff?: boolean
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          category: string | null
          created_at: string
          id: string
          priority: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trade_journal: {
        Row: {
          ai_review_json: Json | null
          closed_at: string | null
          created_at: string
          emotion: string | null
          entry: number | null
          exit: number | null
          id: string
          opened_at: string
          pnl: number | null
          reason: string | null
          screenshot_url: string | null
          side: Database["public"]["Enums"]["trade_side"]
          sl: number | null
          strategy: string | null
          symbol: string
          targets_json: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_review_json?: Json | null
          closed_at?: string | null
          created_at?: string
          emotion?: string | null
          entry?: number | null
          exit?: number | null
          id?: string
          opened_at?: string
          pnl?: number | null
          reason?: string | null
          screenshot_url?: string | null
          side: Database["public"]["Enums"]["trade_side"]
          sl?: number | null
          strategy?: string | null
          symbol: string
          targets_json?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_review_json?: Json | null
          closed_at?: string | null
          created_at?: string
          emotion?: string | null
          entry?: number | null
          exit?: number | null
          id?: string
          opened_at?: string
          pnl?: number | null
          reason?: string | null
          screenshot_url?: string | null
          side?: Database["public"]["Enums"]["trade_side"]
          sl?: number | null
          strategy?: string | null
          symbol?: string
          targets_json?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          prefs_json: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          prefs_json?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          prefs_json?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      watchlist_items: {
        Row: {
          ai_score: number | null
          created_at: string
          id: string
          note: string | null
          symbol: string
          tag_color: string | null
          user_id: string
          watchlist_id: string
        }
        Insert: {
          ai_score?: number | null
          created_at?: string
          id?: string
          note?: string | null
          symbol: string
          tag_color?: string | null
          user_id: string
          watchlist_id: string
        }
        Update: {
          ai_score?: number | null
          created_at?: string
          id?: string
          note?: string | null
          symbol?: string
          tag_color?: string | null
          user_id?: string
          watchlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "watchlist_items_watchlist_id_fkey"
            columns: ["watchlist_id"]
            isOneToOne: false
            referencedRelation: "watchlists"
            referencedColumns: ["id"]
          },
        ]
      }
      watchlists: {
        Row: {
          color: string
          created_at: string
          id: string
          is_pinned: boolean
          name: string
          sort_order: number
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          name: string
          sort_order?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_plan: { Args: { _user_id: string }; Returns: string }
      has_min_plan: {
        Args: { _min_plan: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      plan_rank: { Args: { _plan: string }; Returns: number }
    }
    Enums: {
      alert_kind:
        | "price"
        | "volume"
        | "breakout"
        | "breakdown"
        | "bos"
        | "choch"
        | "order_block"
        | "fvg"
        | "ema_cross"
        | "vwap_cross"
        | "rsi"
        | "macd"
        | "options_oi"
        | "sector_strength"
        | "news"
      app_role: "admin" | "pro" | "user"
      trade_side: "long" | "short"
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
      alert_kind: [
        "price",
        "volume",
        "breakout",
        "breakdown",
        "bos",
        "choch",
        "order_block",
        "fvg",
        "ema_cross",
        "vwap_cross",
        "rsi",
        "macd",
        "options_oi",
        "sector_strength",
        "news",
      ],
      app_role: ["admin", "pro", "user"],
      trade_side: ["long", "short"],
    },
  },
} as const
