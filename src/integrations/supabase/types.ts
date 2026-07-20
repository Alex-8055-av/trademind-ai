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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
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
