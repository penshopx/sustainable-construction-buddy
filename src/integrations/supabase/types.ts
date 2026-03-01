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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      budget_entries: {
        Row: {
          actual_amount: number
          category: string
          created_at: string
          deviation_percent: number | null
          id: string
          mitigation_plan: string
          notes: string
          period_month: string
          planned_amount: number
          project_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_amount?: number
          category?: string
          created_at?: string
          deviation_percent?: number | null
          id?: string
          mitigation_plan?: string
          notes?: string
          period_month?: string
          planned_amount?: number
          project_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_amount?: number
          category?: string
          created_at?: string
          deviation_percent?: number | null
          id?: string
          mitigation_plan?: string
          notes?: string
          period_month?: string
          planned_amount?: number
          project_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_entries_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      bujk_directory: {
        Row: {
          address: string
          city: string
          company_name: string
          created_at: string
          description: string
          email: string
          id: string
          is_published: boolean
          logo_url: string
          nib: string
          npwp: string
          phone: string
          province: string
          qualification: string
          sbu_expiry: string | null
          sbu_number: string
          sub_classification: string
          updated_at: string
          user_id: string
          website: string
        }
        Insert: {
          address?: string
          city?: string
          company_name?: string
          created_at?: string
          description?: string
          email?: string
          id?: string
          is_published?: boolean
          logo_url?: string
          nib?: string
          npwp?: string
          phone?: string
          province?: string
          qualification?: string
          sbu_expiry?: string | null
          sbu_number?: string
          sub_classification?: string
          updated_at?: string
          user_id: string
          website?: string
        }
        Update: {
          address?: string
          city?: string
          company_name?: string
          created_at?: string
          description?: string
          email?: string
          id?: string
          is_published?: boolean
          logo_url?: string
          nib?: string
          npwp?: string
          phone?: string
          province?: string
          qualification?: string
          sbu_expiry?: string | null
          sbu_number?: string
          sub_classification?: string
          updated_at?: string
          user_id?: string
          website?: string
        }
        Relationships: []
      }
      bujk_gallery: {
        Row: {
          caption: string
          created_at: string
          directory_id: string
          id: string
          image_url: string
          project_name: string
          user_id: string
        }
        Insert: {
          caption?: string
          created_at?: string
          directory_id: string
          id?: string
          image_url?: string
          project_name?: string
          user_id: string
        }
        Update: {
          caption?: string
          created_at?: string
          directory_id?: string
          id?: string
          image_url?: string
          project_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bujk_gallery_directory_id_fkey"
            columns: ["directory_id"]
            isOneToOne: false
            referencedRelation: "bujk_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          certificate_number: string
          company: string
          full_name: string
          id: string
          issued_at: string
          level: string
          position: string
          user_id: string
        }
        Insert: {
          certificate_number: string
          company?: string
          full_name?: string
          id?: string
          issued_at?: string
          level: string
          position?: string
          user_id: string
        }
        Update: {
          certificate_number?: string
          company?: string
          full_name?: string
          id?: string
          issued_at?: string
          level?: string
          position?: string
          user_id?: string
        }
        Relationships: []
      }
      competency_domains: {
        Row: {
          description: string
          icon: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          description?: string
          icon?: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          description?: string
          icon?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      competency_scores: {
        Row: {
          computed_at: string
          contribution_points: number
          id: string
          learning_points: number
          period: string
          project_points: number
          toolkit_points: number
          total_score: number
          user_id: string
        }
        Insert: {
          computed_at?: string
          contribution_points?: number
          id?: string
          learning_points?: number
          period: string
          project_points?: number
          toolkit_points?: number
          total_score?: number
          user_id: string
        }
        Update: {
          computed_at?: string
          contribution_points?: number
          id?: string
          learning_points?: number
          period?: string
          project_points?: number
          toolkit_points?: number
          total_score?: number
          user_id?: string
        }
        Relationships: []
      }
      contributions: {
        Row: {
          created_at: string
          description: string
          evidence_url: string
          id: string
          points_awarded: number
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string
          evidence_url?: string
          id?: string
          points_awarded?: number
          title?: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string
          evidence_url?: string
          id?: string
          points_awarded?: number
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      e_course_modules: {
        Row: {
          content: string
          created_at: string
          description: string
          domain_id: string
          duration_minutes: number
          id: string
          level: string
          sort_order: number
          title: string
        }
        Insert: {
          content?: string
          created_at?: string
          description?: string
          domain_id: string
          duration_minutes?: number
          id?: string
          level?: string
          sort_order?: number
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          description?: string
          domain_id?: string
          duration_minutes?: number
          id?: string
          level?: string
          sort_order?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "e_course_modules_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "competency_domains"
            referencedColumns: ["id"]
          },
        ]
      }
      helpdesk_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      helpdesk_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content?: string
          conversation_id: string
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "helpdesk_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "helpdesk_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      innovation_categories: {
        Row: {
          benefits: string[]
          concepts: string[]
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          programs: string[]
          slug: string
          sort_order: number
          stage: number
        }
        Insert: {
          benefits?: string[]
          concepts?: string[]
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name: string
          programs?: string[]
          slug: string
          sort_order?: number
          stage?: number
        }
        Update: {
          benefits?: string[]
          concepts?: string[]
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          programs?: string[]
          slug?: string
          sort_order?: number
          stage?: number
        }
        Relationships: []
      }
      innovation_comments: {
        Row: {
          created_at: string
          id: string
          is_admin: boolean
          message: string
          proposal_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_admin?: boolean
          message?: string
          proposal_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_admin?: boolean
          message?: string
          proposal_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "innovation_comments_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "innovation_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      innovation_proposal_logs: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          new_status: string
          notes: string
          old_status: string
          proposal_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status: string
          notes?: string
          old_status?: string
          proposal_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: string
          notes?: string
          old_status?: string
          proposal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "innovation_proposal_logs_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "innovation_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      innovation_proposals: {
        Row: {
          admin_notes: string
          attachment_name: string
          attachment_url: string
          category_id: string | null
          created_at: string
          description: string
          expected_impact: string
          id: string
          scope: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string
          attachment_name?: string
          attachment_url?: string
          category_id?: string | null
          created_at?: string
          description?: string
          expected_impact?: string
          id?: string
          scope?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string
          attachment_name?: string
          attachment_url?: string
          category_id?: string | null
          created_at?: string
          description?: string
          expected_impact?: string
          id?: string
          scope?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "innovation_proposals_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "innovation_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      k3_checklist_items: {
        Row: {
          category: string
          checklist_id: string
          corrective_action: string
          finding: string
          id: string
          is_compliant: boolean
          item_text: string
          sort_order: number
        }
        Insert: {
          category?: string
          checklist_id: string
          corrective_action?: string
          finding?: string
          id?: string
          is_compliant?: boolean
          item_text?: string
          sort_order?: number
        }
        Update: {
          category?: string
          checklist_id?: string
          corrective_action?: string
          finding?: string
          id?: string
          is_compliant?: boolean
          item_text?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "k3_checklist_items_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "k3_checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      k3_checklists: {
        Row: {
          completed_items: number
          created_at: string
          id: string
          inspection_date: string
          inspector_name: string
          location: string
          notes: string
          project_id: string | null
          score_percent: number | null
          status: string
          total_items: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_items?: number
          created_at?: string
          id?: string
          inspection_date?: string
          inspector_name?: string
          location?: string
          notes?: string
          project_id?: string | null
          score_percent?: number | null
          status?: string
          total_items?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_items?: number
          created_at?: string
          id?: string
          inspection_date?: string
          inspector_name?: string
          location?: string
          notes?: string
          project_id?: string | null
          score_percent?: number | null
          status?: string
          total_items?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "k3_checklists_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      lkut_documents: {
        Row: {
          component: string
          created_at: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          lkut_id: string
          notes: string
          user_id: string
        }
        Insert: {
          component?: string
          created_at?: string
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          lkut_id: string
          notes?: string
          user_id: string
        }
        Update: {
          component?: string
          created_at?: string
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          lkut_id?: string
          notes?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lkut_documents_lkut_id_fkey"
            columns: ["lkut_id"]
            isOneToOne: false
            referencedRelation: "lkut_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      lkut_project_data: {
        Row: {
          actual_duration_days: number
          additional_days: number
          certifications_available: number
          certifications_required: number
          contract_duration_days: number
          created_at: string
          disciplines_available: number
          disciplines_required: number
          equipment_available: number
          equipment_required: number
          experts_available: number
          experts_required: number
          id: string
          lkut_id: string
          progress_actual: number
          progress_planned: number
          project_id: string | null
          quality_score: number
          safety_incidents_major: number
          safety_incidents_minor: number
          total_workers: number
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_duration_days?: number
          additional_days?: number
          certifications_available?: number
          certifications_required?: number
          contract_duration_days?: number
          created_at?: string
          disciplines_available?: number
          disciplines_required?: number
          equipment_available?: number
          equipment_required?: number
          experts_available?: number
          experts_required?: number
          id?: string
          lkut_id: string
          progress_actual?: number
          progress_planned?: number
          project_id?: string | null
          quality_score?: number
          safety_incidents_major?: number
          safety_incidents_minor?: number
          total_workers?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_duration_days?: number
          additional_days?: number
          certifications_available?: number
          certifications_required?: number
          contract_duration_days?: number
          created_at?: string
          disciplines_available?: number
          disciplines_required?: number
          equipment_available?: number
          equipment_required?: number
          experts_available?: number
          experts_required?: number
          id?: string
          lkut_id?: string
          progress_actual?: number
          progress_planned?: number
          project_id?: string | null
          quality_score?: number
          safety_incidents_major?: number
          safety_incidents_minor?: number
          total_workers?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lkut_project_data_lkut_id_fkey"
            columns: ["lkut_id"]
            isOneToOne: false
            referencedRelation: "lkut_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lkut_project_data_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      lkut_reports: {
        Row: {
          asset_value_current: number
          asset_value_previous: number
          awards: string
          certifications: string
          contract_experts: number
          created_at: string
          current_assets: number
          equipment_commitment_fulfilled: boolean | null
          equipment_fulfillment_date: string | null
          experience_pending_list: string
          experience_records_complete: boolean | null
          gcg_applied: boolean | null
          gcg_first_year: number | null
          gross_profit: number
          id: string
          kta_association: string
          kta_expiry_date: string | null
          kta_number: string
          notes: string
          permanent_experts: number
          report_year: number
          sales_value: number
          sbu_expiry_date: string | null
          sbu_number: string
          sbu_type: string
          short_term_liabilities: number
          smap_fulfilled: boolean | null
          smap_report_date: string | null
          smk3_applied: boolean | null
          smk3_first_year: number | null
          status: string
          submitted_at: string | null
          tkk_replacement: boolean | null
          tkk_replacement_date: string | null
          tkk_replacement_notes: string
          total_employees: number
          total_equity: number
          total_liabilities: number
          trained_employees: number
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_value_current?: number
          asset_value_previous?: number
          awards?: string
          certifications?: string
          contract_experts?: number
          created_at?: string
          current_assets?: number
          equipment_commitment_fulfilled?: boolean | null
          equipment_fulfillment_date?: string | null
          experience_pending_list?: string
          experience_records_complete?: boolean | null
          gcg_applied?: boolean | null
          gcg_first_year?: number | null
          gross_profit?: number
          id?: string
          kta_association?: string
          kta_expiry_date?: string | null
          kta_number?: string
          notes?: string
          permanent_experts?: number
          report_year: number
          sales_value?: number
          sbu_expiry_date?: string | null
          sbu_number?: string
          sbu_type?: string
          short_term_liabilities?: number
          smap_fulfilled?: boolean | null
          smap_report_date?: string | null
          smk3_applied?: boolean | null
          smk3_first_year?: number | null
          status?: string
          submitted_at?: string | null
          tkk_replacement?: boolean | null
          tkk_replacement_date?: string | null
          tkk_replacement_notes?: string
          total_employees?: number
          total_equity?: number
          total_liabilities?: number
          trained_employees?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_value_current?: number
          asset_value_previous?: number
          awards?: string
          certifications?: string
          contract_experts?: number
          created_at?: string
          current_assets?: number
          equipment_commitment_fulfilled?: boolean | null
          equipment_fulfillment_date?: string | null
          experience_pending_list?: string
          experience_records_complete?: boolean | null
          gcg_applied?: boolean | null
          gcg_first_year?: number | null
          gross_profit?: number
          id?: string
          kta_association?: string
          kta_expiry_date?: string | null
          kta_number?: string
          notes?: string
          permanent_experts?: number
          report_year?: number
          sales_value?: number
          sbu_expiry_date?: string | null
          sbu_number?: string
          sbu_type?: string
          short_term_liabilities?: number
          smap_fulfilled?: boolean | null
          smap_report_date?: string | null
          smk3_applied?: boolean | null
          smk3_first_year?: number | null
          status?: string
          submitted_at?: string | null
          tkk_replacement?: boolean | null
          tkk_replacement_date?: string | null
          tkk_replacement_notes?: string
          total_employees?: number
          total_equity?: number
          total_liabilities?: number
          trained_employees?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      marketplace_orders: {
        Row: {
          buyer_address: string
          buyer_id: string
          buyer_name: string
          buyer_phone: string
          created_at: string
          id: string
          notes: string
          product_id: string
          quantity: number
          seller_id: string
          status: string
          total_price: number
          updated_at: string
        }
        Insert: {
          buyer_address?: string
          buyer_id: string
          buyer_name?: string
          buyer_phone?: string
          created_at?: string
          id?: string
          notes?: string
          product_id: string
          quantity?: number
          seller_id: string
          status?: string
          total_price?: number
          updated_at?: string
        }
        Update: {
          buyer_address?: string
          buyer_id?: string
          buyer_name?: string
          buyer_phone?: string
          created_at?: string
          id?: string
          notes?: string
          product_id?: string
          quantity?: number
          seller_id?: string
          status?: string
          total_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_products: {
        Row: {
          category: string
          created_at: string
          description: string
          id: string
          image_url: string
          location: string
          price: number
          status: string
          stock: number
          title: string
          unit: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string
          location?: string
          price?: number
          status?: string
          stock?: number
          title: string
          unit?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          id?: string
          image_url?: string
          location?: string
          price?: number
          status?: string
          stock?: number
          title?: string
          unit?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      module_bookmarks: {
        Row: {
          created_at: string
          id: string
          module_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          module_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          module_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_bookmarks_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "e_course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      module_progress: {
        Row: {
          completed_at: string | null
          id: string
          module_id: string
          progress_percent: number
          started_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          id?: string
          module_id: string
          progress_percent?: number
          started_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          id?: string
          module_id?: string
          progress_percent?: number
          started_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_progress_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "e_course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      module_quiz_questions: {
        Row: {
          correct_answer: number
          created_at: string
          explanation: string
          id: string
          module_id: string
          options: Json
          question_text: string
          sort_order: number
        }
        Insert: {
          correct_answer?: number
          created_at?: string
          explanation?: string
          id?: string
          module_id: string
          options?: Json
          question_text?: string
          sort_order?: number
        }
        Update: {
          correct_answer?: number
          created_at?: string
          explanation?: string
          id?: string
          module_id?: string
          options?: Json
          question_text?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "module_quiz_questions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "e_course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      module_quiz_results: {
        Row: {
          completed_at: string
          correct_answers: number
          id: string
          module_id: string
          passed: boolean
          score: number
          total_questions: number
          user_id: string
        }
        Insert: {
          completed_at?: string
          correct_answers?: number
          id?: string
          module_id: string
          passed?: boolean
          score?: number
          total_questions?: number
          user_id: string
        }
        Update: {
          completed_at?: string
          correct_answers?: number
          id?: string
          module_id?: string
          passed?: boolean
          score?: number
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "module_quiz_results_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "e_course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      pancek_assessments: {
        Row: {
          answers: Json
          company_name: string
          completion_percent: number
          created_at: string
          evaluasi_score: number
          evaluasi_total: number
          id: string
          komitmen_score: number
          komitmen_total: number
          nib: string
          npwp: string
          pelaksanaan_score: number
          pelaksanaan_total: number
          perbaikan_score: number
          perbaikan_total: number
          perencanaan_score: number
          perencanaan_total: number
          period_year: number
          respon_score: number
          respon_total: number
          status: string
          total_answered: number
          total_indicators: number
          updated_at: string
          user_id: string
          verification_notes: string
          verified_at: string | null
          verified_by: string
        }
        Insert: {
          answers?: Json
          company_name?: string
          completion_percent?: number
          created_at?: string
          evaluasi_score?: number
          evaluasi_total?: number
          id?: string
          komitmen_score?: number
          komitmen_total?: number
          nib?: string
          npwp?: string
          pelaksanaan_score?: number
          pelaksanaan_total?: number
          perbaikan_score?: number
          perbaikan_total?: number
          perencanaan_score?: number
          perencanaan_total?: number
          period_year: number
          respon_score?: number
          respon_total?: number
          status?: string
          total_answered?: number
          total_indicators?: number
          updated_at?: string
          user_id: string
          verification_notes?: string
          verified_at?: string | null
          verified_by?: string
        }
        Update: {
          answers?: Json
          company_name?: string
          completion_percent?: number
          created_at?: string
          evaluasi_score?: number
          evaluasi_total?: number
          id?: string
          komitmen_score?: number
          komitmen_total?: number
          nib?: string
          npwp?: string
          pelaksanaan_score?: number
          pelaksanaan_total?: number
          perbaikan_score?: number
          perbaikan_total?: number
          perencanaan_score?: number
          perencanaan_total?: number
          period_year?: number
          respon_score?: number
          respon_total?: number
          status?: string
          total_answered?: number
          total_indicators?: number
          updated_at?: string
          user_id?: string
          verification_notes?: string
          verified_at?: string | null
          verified_by?: string
        }
        Relationships: []
      }
      performance_grades: {
        Row: {
          breakdown: Json
          compliance_score: number
          computed_at: string
          created_at: string
          financial_score: number
          grade: string
          id: string
          period: string
          project_score: number
          risk_score: number
          total_score: number
          user_id: string
        }
        Insert: {
          breakdown?: Json
          compliance_score?: number
          computed_at?: string
          created_at?: string
          financial_score?: number
          grade?: string
          id?: string
          period: string
          project_score?: number
          risk_score?: number
          total_score?: number
          user_id: string
        }
        Update: {
          breakdown?: Json
          compliance_score?: number
          computed_at?: string
          created_at?: string
          financial_score?: number
          grade?: string
          id?: string
          period?: string
          project_score?: number
          risk_score?: number
          total_score?: number
          user_id?: string
        }
        Relationships: []
      }
      pre_test_answers: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean
          pre_test_id: string
          question_id: string
          selected_answer: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct?: boolean
          pre_test_id: string
          question_id: string
          selected_answer: number
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean
          pre_test_id?: string
          question_id?: string
          selected_answer?: number
        }
        Relationships: [
          {
            foreignKeyName: "pre_test_answers_pre_test_id_fkey"
            columns: ["pre_test_id"]
            isOneToOne: false
            referencedRelation: "pre_tests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_test_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      pre_tests: {
        Row: {
          completed_at: string | null
          correct_answers: number
          determined_level: string | null
          id: string
          score: number
          started_at: string
          status: string
          total_questions: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          correct_answers?: number
          determined_level?: string | null
          id?: string
          score?: number
          started_at?: string
          status?: string
          total_questions?: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          correct_answers?: number
          determined_level?: string | null
          id?: string
          score?: number
          started_at?: string
          status?: string
          total_questions?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bujk_qualification: string
          company: string
          created_at: string
          current_level: string
          full_name: string
          id: string
          position: string
          total_score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bujk_qualification?: string
          company?: string
          created_at?: string
          current_level?: string
          full_name?: string
          id?: string
          position?: string
          total_score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bujk_qualification?: string
          company?: string
          created_at?: string
          current_level?: string
          full_name?: string
          id?: string
          position?: string
          total_score?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          bujk_name: string
          complexity_score: number
          contract_type: string
          created_at: string
          description: string
          duration_months: number
          ended_at: string | null
          id: string
          location: string
          multidiscipline: boolean
          name: string
          risk_class: string
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
          value_amount: number
        }
        Insert: {
          bujk_name?: string
          complexity_score?: number
          contract_type?: string
          created_at?: string
          description?: string
          duration_months?: number
          ended_at?: string | null
          id?: string
          location?: string
          multidiscipline?: boolean
          name: string
          risk_class?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
          value_amount?: number
        }
        Update: {
          bujk_name?: string
          complexity_score?: number
          contract_type?: string
          created_at?: string
          description?: string
          duration_months?: number
          ended_at?: string | null
          id?: string
          location?: string
          multidiscipline?: boolean
          name?: string
          risk_class?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          value_amount?: number
        }
        Relationships: []
      }
      pub_program_gallery: {
        Row: {
          caption: string
          created_at: string
          id: string
          image_url: string
          program_id: string
        }
        Insert: {
          caption?: string
          created_at?: string
          id?: string
          image_url?: string
          program_id: string
        }
        Update: {
          caption?: string
          created_at?: string
          id?: string
          image_url?: string
          program_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pub_program_gallery_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "pub_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      pub_program_participants: {
        Row: {
          attendance_status: string
          attended_at: string | null
          company: string
          created_at: string
          email: string
          full_name: string
          id: string
          notes: string
          phone: string
          position: string
          program_id: string
          registered_at: string
        }
        Insert: {
          attendance_status?: string
          attended_at?: string | null
          company?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          notes?: string
          phone?: string
          position?: string
          program_id: string
          registered_at?: string
        }
        Update: {
          attendance_status?: string
          attended_at?: string | null
          company?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          notes?: string
          phone?: string
          position?: string
          program_id?: string
          registered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pub_program_participants_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "pub_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      pub_program_updates: {
        Row: {
          content: string
          created_at: string
          id: string
          program_id: string
          published_at: string
          title: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          program_id: string
          published_at?: string
          title: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          program_id?: string
          published_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "pub_program_updates_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "pub_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      pub_programs: {
        Row: {
          category: string
          created_at: string
          description: string
          end_date: string | null
          id: string
          image_url: string
          location: string
          progress_percent: number
          start_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string
          end_date?: string | null
          id?: string
          image_url?: string
          location?: string
          progress_percent?: number
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          end_date?: string | null
          id?: string
          image_url?: string
          location?: string
          progress_percent?: number
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          correct_answer: number
          created_at: string
          difficulty: string
          domain_id: string
          explanation: string
          id: string
          options: Json
          question_text: string
        }
        Insert: {
          correct_answer?: number
          created_at?: string
          difficulty?: string
          domain_id: string
          explanation?: string
          id?: string
          options?: Json
          question_text: string
        }
        Update: {
          correct_answer?: number
          created_at?: string
          difficulty?: string
          domain_id?: string
          explanation?: string
          id?: string
          options?: Json
          question_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "competency_domains"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          action: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      risk_registers: {
        Row: {
          created_at: string
          due_date: string | null
          id: string
          impact_score: number
          mitigation_action: string
          owner: string
          probability_score: number
          project_id: string | null
          risk_description: string
          risk_level: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          id?: string
          impact_score?: number
          mitigation_action?: string
          owner?: string
          probability_score?: number
          project_id?: string | null
          risk_description?: string
          risk_level?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          due_date?: string | null
          id?: string
          impact_score?: number
          mitigation_action?: string
          owner?: string
          probability_score?: number
          project_id?: string | null
          risk_description?: string
          risk_level?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_registers_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      smap_documents: {
        Row: {
          certificate_scope: string
          company_name: string
          created_at: string
          doc_type: string
          document_number: string
          expiry_date: string | null
          file_name: string
          file_url: string
          id: string
          issued_date: string | null
          issuing_body: string
          notes: string
          participant_count: number
          sbu_application_type: string
          signatory_name: string
          signatory_position: string
          status: string
          training_hours: number
          training_name: string
          training_provider: string
          updated_at: string
          user_id: string
          verification_notes: string
          verified_at: string | null
          verified_by: string
        }
        Insert: {
          certificate_scope?: string
          company_name?: string
          created_at?: string
          doc_type?: string
          document_number?: string
          expiry_date?: string | null
          file_name?: string
          file_url?: string
          id?: string
          issued_date?: string | null
          issuing_body?: string
          notes?: string
          participant_count?: number
          sbu_application_type?: string
          signatory_name?: string
          signatory_position?: string
          status?: string
          training_hours?: number
          training_name?: string
          training_provider?: string
          updated_at?: string
          user_id: string
          verification_notes?: string
          verified_at?: string | null
          verified_by?: string
        }
        Update: {
          certificate_scope?: string
          company_name?: string
          created_at?: string
          doc_type?: string
          document_number?: string
          expiry_date?: string | null
          file_name?: string
          file_url?: string
          id?: string
          issued_date?: string | null
          issuing_body?: string
          notes?: string
          participant_count?: number
          sbu_application_type?: string
          signatory_name?: string
          signatory_position?: string
          status?: string
          training_hours?: number
          training_name?: string
          training_provider?: string
          updated_at?: string
          user_id?: string
          verification_notes?: string
          verified_at?: string | null
          verified_by?: string
        }
        Relationships: []
      }
      toolkit_activities: {
        Row: {
          completeness: number
          created_at: string
          entity_id: string | null
          id: string
          points_awarded: number
          project_id: string | null
          tool_type: string
          user_id: string
        }
        Insert: {
          completeness?: number
          created_at?: string
          entity_id?: string | null
          id?: string
          points_awarded?: number
          project_id?: string | null
          tool_type: string
          user_id: string
        }
        Update: {
          completeness?: number
          created_at?: string
          entity_id?: string | null
          id?: string
          points_awarded?: number
          project_id?: string | null
          tool_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "toolkit_activities_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
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
      user_subscriptions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          plan: string
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan?: string
          started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          plan?: string
          started_at?: string
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
      check_question_answer: {
        Args: { _question_id: string; _selected_answer: number }
        Returns: Json
      }
      get_questions_safe: {
        Args: never
        Returns: {
          created_at: string
          difficulty: string
          domain_id: string
          id: string
          options: Json
          question_text: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      submit_assessment: {
        Args: { _answers: Json; _pre_test_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
