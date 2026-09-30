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
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      app_users: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          role: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          role?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          role?: string
        }
        Relationships: []
      }
      challenge_categories: {
        Row: {
          code: string
          color: string
          name: string
          sort_order: number
        }
        Insert: {
          code: string
          color: string
          name: string
          sort_order?: number
        }
        Update: {
          code?: string
          color?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      challenge_notes: {
        Row: {
          action_done: boolean
          action_owner: string | null
          body: string
          challenge_id: string
          created_at: string
          created_by: string | null
          due_date: string | null
          id: string
          note_type: Database["public"]["Enums"]["note_type"]
          pinned: boolean
          source: string | null
          updated_at: string
        }
        Insert: {
          action_done?: boolean
          action_owner?: string | null
          body: string
          challenge_id: string
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          note_type?: Database["public"]["Enums"]["note_type"]
          pinned?: boolean
          source?: string | null
          updated_at?: string
        }
        Update: {
          action_done?: boolean
          action_owner?: string | null
          body?: string
          challenge_id?: string
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: string
          note_type?: Database["public"]["Enums"]["note_type"]
          pinned?: boolean
          source?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_notes_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_notes_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges_summary"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          archived_at: string | null
          ask: string | null
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          owner: string | null
          priority: Database["public"]["Enums"]["challenge_priority"]
          raised_by: string | null
          related_item_code: string | null
          sort_order: number
          status: Database["public"]["Enums"]["challenge_status"]
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          archived_at?: string | null
          ask?: string | null
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          owner?: string | null
          priority?: Database["public"]["Enums"]["challenge_priority"]
          raised_by?: string | null
          related_item_code?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["challenge_status"]
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          archived_at?: string | null
          ask?: string | null
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          owner?: string | null
          priority?: Database["public"]["Enums"]["challenge_priority"]
          raised_by?: string | null
          related_item_code?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["challenge_status"]
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenges_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "challenge_categories"
            referencedColumns: ["code"]
          },
        ]
      }
      roadmap_item_history: {
        Row: {
          after: Json | null
          before: Json | null
          changed_at: string
          changed_by: string | null
          id: number
          item_id: string
        }
        Insert: {
          after?: Json | null
          before?: Json | null
          changed_at?: string
          changed_by?: string | null
          id?: never
          item_id: string
        }
        Update: {
          after?: Json | null
          before?: Json | null
          changed_at?: string
          changed_by?: string | null
          id?: never
          item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_item_history_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "roadmap_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "roadmap_item_history_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "roadmap_items_scored"
            referencedColumns: ["id"]
          },
        ]
      }
      roadmap_items: {
        Row: {
          adjustment_reason: string | null
          archived_at: string | null
          code: string
          created_at: string
          created_by: string | null
          depends_on_codes: string[]
          description: string | null
          ease: number | null
          end_date: string | null
          horizon: Database["public"]["Enums"]["horizon"]
          id: string
          is_mvp: boolean
          name: string
          operational_efficiency: number | null
          outcome: string | null
          owner: string | null
          revenue_impact: number | null
          score_adjustment: number
          sort_order: number
          start_date: string | null
          unlocks: number | null
          updated_at: string
          updated_by: string | null
          workstream: string
        }
        Insert: {
          adjustment_reason?: string | null
          archived_at?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          depends_on_codes?: string[]
          description?: string | null
          ease?: number | null
          end_date?: string | null
          horizon?: Database["public"]["Enums"]["horizon"]
          id?: string
          is_mvp?: boolean
          name: string
          operational_efficiency?: number | null
          outcome?: string | null
          owner?: string | null
          revenue_impact?: number | null
          score_adjustment?: number
          sort_order?: number
          start_date?: string | null
          unlocks?: number | null
          updated_at?: string
          updated_by?: string | null
          workstream: string
        }
        Update: {
          adjustment_reason?: string | null
          archived_at?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          depends_on_codes?: string[]
          description?: string | null
          ease?: number | null
          end_date?: string | null
          horizon?: Database["public"]["Enums"]["horizon"]
          id?: string
          is_mvp?: boolean
          name?: string
          operational_efficiency?: number | null
          outcome?: string | null
          owner?: string | null
          revenue_impact?: number | null
          score_adjustment?: number
          sort_order?: number
          start_date?: string | null
          unlocks?: number | null
          updated_at?: string
          updated_by?: string | null
          workstream?: string
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_items_workstream_fkey"
            columns: ["workstream"]
            isOneToOne: false
            referencedRelation: "workstreams"
            referencedColumns: ["code"]
          },
        ]
      }
      scoring_weights: {
        Row: {
          id: number
          updated_at: string
          updated_by: string | null
          w_ease: number
          w_operational: number
          w_revenue: number
          w_unlocks: number
        }
        Insert: {
          id?: number
          updated_at?: string
          updated_by?: string | null
          w_ease?: number
          w_operational?: number
          w_revenue?: number
          w_unlocks?: number
        }
        Update: {
          id?: number
          updated_at?: string
          updated_by?: string | null
          w_ease?: number
          w_operational?: number
          w_revenue?: number
          w_unlocks?: number
        }
        Relationships: []
      }
      settings: {
        Row: {
          key: string
          value: Json
        }
        Insert: {
          key: string
          value: Json
        }
        Update: {
          key?: string
          value?: Json
        }
        Relationships: []
      }
      workstreams: {
        Row: {
          code: string
          color: string
          description: string | null
          name: string
          sort_order: number
        }
        Insert: {
          code: string
          color: string
          description?: string | null
          name: string
          sort_order?: number
        }
        Update: {
          code?: string
          color?: string
          description?: string | null
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
    }
    Views: {
      challenges_summary: {
        Row: {
          advice_count: number | null
          archived_at: string | null
          ask: string | null
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string | null
          last_note_at: string | null
          note_count: number | null
          open_actions: number | null
          owner: string | null
          priority: Database["public"]["Enums"]["challenge_priority"] | null
          raised_by: string | null
          related_item_code: string | null
          sort_order: number | null
          status: Database["public"]["Enums"]["challenge_status"] | null
          title: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          advice_count?: never
          archived_at?: string | null
          ask?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string | null
          last_note_at?: never
          note_count?: never
          open_actions?: never
          owner?: string | null
          priority?: Database["public"]["Enums"]["challenge_priority"] | null
          raised_by?: string | null
          related_item_code?: string | null
          sort_order?: number | null
          status?: Database["public"]["Enums"]["challenge_status"] | null
          title?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          advice_count?: never
          archived_at?: string | null
          ask?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string | null
          last_note_at?: never
          note_count?: never
          open_actions?: never
          owner?: string | null
          priority?: Database["public"]["Enums"]["challenge_priority"] | null
          raised_by?: string | null
          related_item_code?: string | null
          sort_order?: number | null
          status?: Database["public"]["Enums"]["challenge_status"] | null
          title?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "challenges_category_fkey"
            columns: ["category"]
            isOneToOne: false
            referencedRelation: "challenge_categories"
            referencedColumns: ["code"]
          },
        ]
      }
      roadmap_items_scored: {
        Row: {
          adjustment_reason: string | null
          archived_at: string | null
          base_score: number | null
          code: string | null
          created_at: string | null
          created_by: string | null
          depends_on_codes: string[] | null
          description: string | null
          ease: number | null
          end_date: string | null
          horizon: Database["public"]["Enums"]["horizon"] | null
          id: string | null
          is_mvp: boolean | null
          name: string | null
          operational_efficiency: number | null
          outcome: string | null
          owner: string | null
          revenue_impact: number | null
          score: number | null
          score_adjustment: number | null
          sort_order: number | null
          start_date: string | null
          unlocks: number | null
          updated_at: string | null
          updated_by: string | null
          w_ease: number | null
          w_operational: number | null
          w_revenue: number | null
          w_unlocks: number | null
          workstream: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roadmap_items_workstream_fkey"
            columns: ["workstream"]
            isOneToOne: false
            referencedRelation: "workstreams"
            referencedColumns: ["code"]
          },
        ]
      }
    }
    Functions: {
      can_edit: { Args: never; Returns: boolean }
      current_email: { Args: never; Returns: string }
      is_member: { Args: never; Returns: boolean }
    }
    Enums: {
      challenge_priority: "high" | "medium" | "low"
      challenge_status:
        | "open"
        | "discussing"
        | "action_agreed"
        | "resolved"
        | "parked"
      horizon: "done" | "now" | "next" | "later" | "not_now"
      note_type: "advice" | "decision" | "action" | "question" | "comment"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      challenge_priority: ["high", "medium", "low"],
      challenge_status: [
        "open",
        "discussing",
        "action_agreed",
        "resolved",
        "parked",
      ],
      horizon: ["done", "now", "next", "later", "not_now"],
      note_type: ["advice", "decision", "action", "question", "comment"],
    },
  },
} as const
