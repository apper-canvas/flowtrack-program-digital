import { getApperClient } from "@/services/apperClient"
import { toast } from "react-toastify"

export const taskService = {
  async getAll() {
    try {
      const apperClient = getApperClient()
      
      if (!apperClient) {
        console.error("ApperClient not initialized")
        return []
      }

      const params = {
        fields: [
          {"field": {"Name": "Name"}},
          {"field": {"Name": "title_c"}},
          {"field": {"Name": "description_c"}},
          {"field": {"Name": "priority_c"}},
          {"field": {"Name": "status_c"}},
          {"field": {"Name": "completed_at_c"}},
          {"field": {"Name": "CreatedOn"}}
        ],
        orderBy: [{"fieldName": "CreatedOn", "sorttype": "DESC"}]
      }

      const response = await apperClient.fetchRecords("task_c", params)

      if (!response.success) {
        console.error(response.message)
        toast.error(response.message)
        return []
      }

      // Transform database fields to component format
      return response.data.map(task => ({
        Id: task.Id,
        title: task.title_c || "",
        description: task.description_c || "",
        priority: task.priority_c || "medium",
        status: task.status_c || "active",
        completedAt: task.completed_at_c || null,
        createdAt: task.CreatedOn
      }))

    } catch (error) {
      console.error("Error fetching tasks:", error?.response?.data?.message || error)
      return []
    }
  },

  async getById(id) {
    try {
      const apperClient = getApperClient()
      
      if (!apperClient) {
        console.error("ApperClient not initialized")
        return null
      }

      const params = {
        fields: [
          {"field": {"Name": "Name"}},
          {"field": {"Name": "title_c"}},
          {"field": {"Name": "description_c"}},
          {"field": {"Name": "priority_c"}},
          {"field": {"Name": "status_c"}},
          {"field": {"Name": "completed_at_c"}},
          {"field": {"Name": "CreatedOn"}}
        ]
      }

      const response = await apperClient.getRecordById("task_c", parseInt(id), params)

      if (!response.success) {
        console.error(response.message)
        throw new Error(`Task with Id ${id} not found`)
      }

      // Transform database fields to component format
      const task = response.data
      return {
        Id: task.Id,
        title: task.title_c || "",
        description: task.description_c || "",
        priority: task.priority_c || "medium",
        status: task.status_c || "active",
        completedAt: task.completed_at_c || null,
        createdAt: task.CreatedOn
      }

    } catch (error) {
      console.error(`Error fetching task ${id}:`, error?.response?.data?.message || error)
      throw error
    }
  },

  async create(taskData) {
    try {
      const apperClient = getApperClient()
      
      if (!apperClient) {
        console.error("ApperClient not initialized")
        throw new Error("Database connection not available")
      }

// Convert files to proper database format if provided
      let convertedFiles = null;
      if (taskData.files_c && Array.isArray(taskData.files_c) && taskData.files_c.length > 0) {
        try {
          if (window.ApperSDK?.ApperFileUploader?.toCreateFormat) {
            convertedFiles = window.ApperSDK.ApperFileUploader.toCreateFormat(taskData.files_c);
          } else {
            convertedFiles = taskData.files_c;
          }
        } catch (fileError) {
          console.warn('Error converting files, using original format:', fileError);
          convertedFiles = taskData.files_c;
        }
      }

      // Only send Updateable fields to database
      const params = {
        records: [{
          Name: taskData.title, // System field for record identification
          title_c: taskData.title,
          description_c: taskData.description || "",
          priority_c: taskData.priority || "medium",
          status_c: taskData.status || "active",
          completed_at_c: taskData.completedAt || null,
          ...(convertedFiles && { files_c: convertedFiles })
        }]
      }

const response = await apperClient.createRecord("task_c", params)
      if (!response.success) {
        console.error(response.message)
        toast.error(response.message)
        throw new Error(response.message)
      }

      if (response.results) {
        const successful = response.results.filter(r => r.success)
        const failed = response.results.filter(r => !r.success)
        
        if (failed.length > 0) {
          console.error(`Failed to create ${failed.length} tasks: ${JSON.stringify(failed)}`)
          failed.forEach(record => {
            record.errors?.forEach(error => toast.error(`${error.fieldLabel}: ${error}`))
            if (record.message) toast.error(record.message)
          })
        }

        if (successful.length > 0) {
const createdTask = successful[0].data
          return {
            Id: createdTask.Id,
            title: createdTask.title_c || taskData.title,
            description: createdTask.description_c || taskData.description || "",
            priority: createdTask.priority_c || taskData.priority || "medium",
            status: createdTask.status_c || taskData.status || "active",
            completedAt: createdTask.completed_at_c || taskData.completedAt || null,
            createdAt: createdTask.CreatedOn,
            files: createdTask.files_c || []
          }
        }
      }

      throw new Error("Failed to create task")

    } catch (error) {
      console.error("Error creating task:", error?.response?.data?.message || error)
      throw error
    }
  },

  async update(id, updates) {
    try {
      const apperClient = getApperClient()
      
      if (!apperClient) {
        console.error("ApperClient not initialized")
        throw new Error("Database connection not available")
      }

      // Only send Updateable fields to database
      const updateFields = {
        Id: parseInt(id)
      }

      // Map component fields to database fields, only include non-empty values
      if (updates.title !== undefined) {
        updateFields.Name = updates.title
        updateFields.title_c = updates.title
      }
      if (updates.description !== undefined) {
        updateFields.description_c = updates.description
      }
      if (updates.priority !== undefined) {
        updateFields.priority_c = updates.priority
      }
      if (updates.status !== undefined) {
        updateFields.status_c = updates.status
      }
      if (updates.completedAt !== undefined) {
        updateFields.completed_at_c = updates.completedAt
      }

      const params = {
        records: [updateFields]
      }

      const response = await apperClient.updateRecord("task_c", params)

      if (!response.success) {
        console.error(response.message)
        toast.error(response.message)
        throw new Error(response.message)
      }

      if (response.results) {
        const successful = response.results.filter(r => r.success)
        const failed = response.results.filter(r => !r.success)
        
        if (failed.length > 0) {
          console.error(`Failed to update ${failed.length} tasks: ${JSON.stringify(failed)}`)
          failed.forEach(record => {
            record.errors?.forEach(error => toast.error(`${error.fieldLabel}: ${error}`))
            if (record.message) toast.error(record.message)
          })
        }

        if (successful.length > 0) {
          const updatedTask = successful[0].data
          return {
            Id: updatedTask.Id,
            title: updatedTask.title_c || "",
            description: updatedTask.description_c || "",
            priority: updatedTask.priority_c || "medium",
            status: updatedTask.status_c || "active",
            completedAt: updatedTask.completed_at_c || null,
            createdAt: updatedTask.CreatedOn
          }
        }
      }

      throw new Error(`Task with Id ${id} not found`)

    } catch (error) {
      console.error("Error updating task:", error?.response?.data?.message || error)
      throw error
    }
  },

  async delete(id) {
    try {
      const apperClient = getApperClient()
      
      if (!apperClient) {
        console.error("ApperClient not initialized")
        throw new Error("Database connection not available")
      }

      const params = { 
        RecordIds: [parseInt(id)]
      }

      const response = await apperClient.deleteRecord("task_c", params)

      if (!response.success) {
        console.error(response.message)
        toast.error(response.message)
        throw new Error(response.message)
      }

      if (response.results) {
        const successful = response.results.filter(r => r.success)
        const failed = response.results.filter(r => !r.success)
        
        if (failed.length > 0) {
          console.error(`Failed to delete ${failed.length} tasks: ${JSON.stringify(failed)}`)
          failed.forEach(record => {
            if (record.message) toast.error(record.message)
          })
        }
        
        return successful.length > 0
      }

      throw new Error(`Task with Id ${id} not found`)

    } catch (error) {
      console.error("Error deleting task:", error?.response?.data?.message || error)
      throw error
    }
  }
}