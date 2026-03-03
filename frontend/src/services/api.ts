const BASE = "/api/v1";
class ApiClient {
  private headers(): HeadersInit {
    const t = localStorage.getItem("access_token");
    return { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) };
  }
  async get<T>(path: string): Promise<T> {
    const r = await fetch(`${BASE}${path}`, { headers: this.headers() });
    if (r.status === 401) { if (await this.refresh()) return this.get(path); throw new Error("Unauthorized"); }
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }
  async post<T>(path: string, body?: unknown): Promise<T> {
    console.log(`API POST ${path} with body:`, body);
    const r = await fetch(`${BASE}${path}`, { method: "POST", headers: this.headers(), body: body ? JSON.stringify(body) : undefined });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }
  async put<T>(path: string, body: unknown): Promise<T> {
    const r = await fetch(`${BASE}${path}`, { method: "PUT", headers: this.headers(), body: JSON.stringify(body) });
    if (!r.ok) throw new Error(await r.text());
    return r.json();
  }
  private async refresh(): Promise<boolean> {
    const t = localStorage.getItem("refresh_token");
    if (!t) { this.logout(); return false; }
    try {
      const r = await fetch(`${BASE}/auth/refresh?token=${encodeURIComponent(t)}`, { method: "POST", headers: { "Content-Type": "application/json" } });
      if (!r.ok) { this.logout(); return false; }
      const d = await r.json();
      localStorage.setItem("access_token", d.access_token);
      localStorage.setItem("refresh_token", d.refresh_token);
      return true;
    } catch { this.logout(); return false; }
  }
  logout() { localStorage.clear(); window.location.href = "/login"; }
}
export const api = new ApiClient();
export interface TokenResponse { access_token: string; refresh_token: string; token_type: string; user_id: number; email: string; role: string; }
export interface LiveReading { solar_power_w: number; grid_power_w: number; load_power_w: number; timestamp: string | null; }
export interface DailySummary { date: string; solar_kwh: number; grid_import_kwh: number; grid_export_kwh: number; load_kwh: number; self_consumed_kwh: number; peak_solar_w: number; estimated_savings_thb: number; }
export interface MonthlySummary { year: number; month: number; solar_kwh: number; grid_import_kwh: number; grid_export_kwh: number; load_kwh: number; estimated_savings_thb: number; }
export interface SystemHealth { device_id: string; firmware: string; timestamp: string; cpu_percent: number; memory_percent: number; disk_used_gb: number; disk_total_gb: number; disk_percent: number; uptime_seconds: number; platform: string; }
export interface ROIResult { installation_cost_thb: number; payback_year: number | null; npv_thb: number; total_generation_kwh: number; total_savings_thb: number; cashflows: Array<{ year: number; annual_kwh: number; tariff_thb: number; savings_thb: number; export_revenue_thb: number; annual_benefit_thb: number; cumulative_thb: number; }>; }
export interface SolarEstimate { year_offset: number; monthly_kwh: Record<string, number>; annual_kwh: number; }
export interface SolarConfig { id?: number; system_capacity_kw: number; performance_ratio: number; degradation_rate: number; installation_cost_thb: number; province_id: number; district_id: number; subdistrict_id: number; electricity_tariff_thb: number; feed_in_tariff_thb: number; self_consumption_ratio: number; is_active?: boolean; }
