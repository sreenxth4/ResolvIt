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
      departments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          sla_hours: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          sla_hours?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          sla_hours?: number
        }
        Relationships: []
      }
      mandals: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      issue_reports: {
        Row: {
          created_at: string
          description: string
          id: string
          image_url: string | null
          issue_id: string
          reporter_id: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          image_url?: string | null
          issue_id: string
          reporter_id: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          issue_id?: string
          reporter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "issue_reports_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      issues: {
        Row: {
          assigned_authority_id: string | null
          category: Database["public"]["Enums"]["issue_category"]
          created_at: string
          department_id: string | null
          description: string
          id: string
          image_url: string | null
          lat: number
          lng: number
          priority_score: number
          report_count: number
          reporter_id: string
          severity: number
          status: Database["public"]["Enums"]["issue_status"]
          title: string
          updated_at: string
          upvote_count: number
        }
        Insert: {
          assigned_authority_id?: string | null
          category?: Database["public"]["Enums"]["issue_category"]
          created_at?: string
          department_id?: string | null
          description: string
          id?: string
          image_url?: string | null
          lat: number
          lng: number
          priority_score?: number
          report_count?: number
          reporter_id: string
          severity?: number
          status?: Database["public"]["Enums"]["issue_status"]
          title: string
          updated_at?: string
          upvote_count?: number
        }
        Update: {
          assigned_authority_id?: string | null
          category?: Database["public"]["Enums"]["issue_category"]
          created_at?: string
          department_id?: string | null
          description?: string
          id?: string
          image_url?: string | null
          lat?: number
          lng?: number
          priority_score?: number
          report_count?: number
          reporter_id?: string
          severity?: number
          status?: Database["public"]["Enums"]["issue_status"]
          title?: string
          updated_at?: string
          upvote_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "issues_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          issue_id: string | null
          message: string
          read: boolean
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          issue_id?: string | null
          message: string
          read?: boolean
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          issue_id?: string | null
          message?: string
          read?: boolean
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      points_ledger: {
        Row: {
          created_at: string
          id: string
          issue_id: string | null
          points: number
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          issue_id?: string | null
          points: number
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          issue_id?: string | null
          points?: number
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "points_ledger_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          aadhaar_hash: string | null
          avatar_url: string | null
          created_at: string
          department_id: string | null
          id: string
          mandal_id: string | null
          mobile_number: string | null
          name: string
          points_total: number
          updated_at: string
        }
        Insert: {
          aadhaar_hash?: string | null
          avatar_url?: string | null
          created_at?: string
          department_id?: string | null
          id: string
          mandal_id?: string | null
          mobile_number?: string | null
          name?: string
          points_total?: number
          updated_at?: string
        }
        Update: {
          aadhaar_hash?: string | null
          avatar_url?: string | null
          created_at?: string
          department_id?: string | null
          id?: string
          mandal_id?: string | null
          mobile_number?: string | null
          name?: string
          points_total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_mandal_id_fkey"
            columns: ["mandal_id"]
            isOneToOne: false
            referencedRelation: "mandals"
            referencedColumns: ["id"]
          },
        ]
      }
      status_logs: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          issue_id: string
          new_status: Database["public"]["Enums"]["issue_status"]
          note: string | null
          old_status: Database["public"]["Enums"]["issue_status"] | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          issue_id: string
          new_status: Database["public"]["Enums"]["issue_status"]
          note?: string | null
          old_status?: Database["public"]["Enums"]["issue_status"] | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          issue_id?: string
          new_status?: Database["public"]["Enums"]["issue_status"]
          note?: string | null
          old_status?: Database["public"]["Enums"]["issue_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "status_logs_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      upvotes: {
        Row: {
          created_at: string
          id: string
          issue_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          issue_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          issue_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "upvotes_issue_id_fkey"
            columns: ["issue_id"]
            isOneToOne: false
            referencedRelation: "issues"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          department_id: string | null
          id: string
          mandal_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          department_id?: string | null
          id?: string
          mandal_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          department_id?: string | null
          id?: string
          mandal_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_mandal_id_fkey"
            columns: ["mandal_id"]
            isOneToOne: false
            referencedRelation: "mandals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      _hash_aadhaar: {
        Args: { _aadhaar: string; _user_id: string }
        Returns: undefined
      }
      calculate_priority_score: {
        Args: {
          _created_at: string
          _report_count: number
          _severity: number
          _upvote_count: number
        }
        Returns: number
      }
      get_user_department_id: { Args: { _user_id: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      recalculate_all_priorities: { Args: never; Returns: undefined }
      verify_authority_credentials: {
        Args: { _aadhaar: string; _mobile: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "citizen" | "authority" | "admin"
      issue_category:
        | "roads"
        | "water"
        | "electricity"
        | "sanitation"
        | "public_safety"
        | "parks"
        | "other"
      issue_status: "open" | "in_progress" | "resolved" | "escalated"
      notification_type:
        | "issue_assigned"
        | "issue_escalated"
        | "issue_resolved"
        | "upvote_milestone"
        | "status_change"
        | "new_report"
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
      app_role: ["citizen", "authority", "admin"],
      issue_category: [
        "roads",
        "water",
        "electricity",
        "sanitation",
        "public_safety",
        "parks",
        "other",
      ],
      issue_status: ["open", "in_progress", "resolved", "escalated"],
      notification_type: [
        "issue_assigned",
        "issue_escalated",
        "issue_resolved",
        "upvote_milestone",
        "status_change",
        "new_report",
      ],
    },
  },
} as const
