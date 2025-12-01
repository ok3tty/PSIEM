// Types for IDS alerts
export interface IDSAlert {
  timestamp: string;
  alert?: {
    signature?: string;
    severity?: number;
    category?: string;
  };
  src_ip?: string;
  dest_ip?: string;
  proto?: string;
  event_type?: string;
}

export interface AlertStats {
  total: number;
  bySeverity: { [key: string]: number };
  byCategory: { [key: string]: number };
}

const ES_BASE_URL = '/elasticsearch';

export const elasticsearchService = {
  // Fetch recent IDS alerts
  async getRecentAlerts(limit = 100): Promise<IDSAlert[]> {
    try {
      const response = await fetch(`${ES_BASE_URL}/siem-ids-*/_search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          size: limit,
          sort: [{ timestamp: { order: 'desc' } }],
          query: {
            match_all: {}
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.hits.hits.map((hit: any) => hit._source);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      throw error;
    }
  },

  // Get alert statistics
  async getAlertStats(): Promise<AlertStats> {
    try {
      const response = await fetch(`${ES_BASE_URL}/siem-ids-*/_search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          size: 0,
          aggs: {
            total_alerts: {
              value_count: { field: 'timestamp.keyword' }
            },
            alerts_by_severity: {
              terms: { field: 'alert.severity', size: 10 }
            },
            alerts_by_category: {
              terms: { field: 'alert.category.keyword', size: 10 }
            }
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        total: data.aggregations.total_alerts.value,
        bySeverity: data.aggregations.alerts_by_severity.buckets.reduce(
          (acc: any, bucket: any) => ({ ...acc, [bucket.key]: bucket.doc_count }), {}
        ),
        byCategory: data.aggregations.alerts_by_category.buckets.reduce(
          (acc: any, bucket: any) => ({ ...acc, [bucket.key]: bucket.doc_count }), {}
        )
      };
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  },

  // Search alerts
  async searchAlerts(searchQuery: string, limit = 100): Promise<IDSAlert[]> {
    try {
      const response = await fetch(`${ES_BASE_URL}/siem-ids-*/_search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          size: limit,
          query: {
            query_string: {
              query: searchQuery
            }
          },
          sort: [{ timestamp: { order: 'desc' } }]
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.hits.hits.map((hit: any) => hit._source);
    } catch (error) {
      console.error('Error searching alerts:', error);
      throw error;
    }
  }
};
