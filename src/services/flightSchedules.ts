import { supabase } from "@/integrations/supabase/client";
import type { Database, Tables } from "@/integrations/supabase/types";

type FlightScheduleRow = Database["public"]["Tables"]["flight_schedules"]["Row"];
type AircraftRow = Database["public"]["Tables"]["aircraft"]["Row"];
type ClientRow = Database["public"]["Tables"]["clients"]["Row"];
type CrewMemberRow = Database["public"]["Tables"]["crew_members"]["Row"];
type FlightPlanRow = Database["public"]["Tables"]["flight_plans"]["Row"];

type FlightScheduleRelations = {
  aircraft?: Pick<AircraftRow, "id" | "registration" | "model"> | null;
  clients?: Pick<ClientRow, "id" | "company_name"> | null;
  flight_plans?: Pick<FlightPlanRow, "id">[] | null;
};

export type FlightScheduleWithDetails = FlightScheduleRow &
  FlightScheduleRelations & {
    crew_members?: Pick<CrewMemberRow, "full_name"> | null;
  };

type FetchFlightSchedulesOptions = {
  status?: FlightScheduleRow["status"];
  includeFlightPlans?: boolean;
};

export async function fetchFlightSchedulesWithDetails(
  options: FetchFlightSchedulesOptions = {}
): Promise<FlightScheduleWithDetails[]> {
  const { status, includeFlightPlans = false } = options;

  let selectString =
    "*, aircraft:aircraft_id(id, registration, model), clients:client_id(id, company_name)";

  if (includeFlightPlans) {
    selectString += ", flight_plans(id)";
  }

  let query = supabase
    .from("flight_schedules")
    .select(selectString)
    .order("flight_date", { ascending: true });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error details:", error);
    throw new Error(`Falha ao buscar agendamentos: ${error.message}`);
  }

  const schedules = (data ?? []) as unknown as (Tables<'flight_schedules'> & FlightScheduleRelations)[];

  const crewIds = Array.from(
    new Set(
      schedules
        .map((schedule) => schedule.crew_member_id)
        .filter((id): id is string => Boolean(id))
    )
  );

  let crewMap = new Map<string, CrewMemberRow["full_name"] | null>();

  if (crewIds.length > 0) {
    const { data: crewData, error: crewError } = await supabase
      .from("crew_members")
      .select("id, full_name")
      .in("id", crewIds);

    if (crewError) {
      throw crewError;
    }

    (crewData ?? []).forEach((crew) => {
      crewMap.set(crew.id, crew.full_name ?? null);
    });
  }

  return schedules.map((schedule) => ({
    ...schedule,
    crew_members: schedule.crew_member_id
      ? { full_name: crewMap.get(schedule.crew_member_id) ?? null }
      : null,
  }));
}
