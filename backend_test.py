import requests
import sys
import json
import os
from datetime import datetime
from pathlib import Path
import tempfile

class RegulationExtractorAPITester:
    def __init__(self, base_url="https://regtable.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.document_id = None
        self.column_id = None
        self.template_id = None
        self.statement_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}" if not endpoint.startswith('http') else endpoint
        headers = {}
        
        if files is None and data is not None:
            headers['Content-Type'] = 'application/json'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, data=data)
                else:
                    response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.content else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test API root endpoint"""
        success, response = self.run_test(
            "API Root",
            "GET",
            "",
            200
        )
        return success

    def test_document_upload(self):
        """Test document upload functionality"""
        # Create a test text file
        test_content = """
        REGULATION DOCUMENT
        
        Section 1.1 - General Requirements
        All entities must comply with the following obligations:
        
        1.1.1 Risk Management
        Organizations shall establish and maintain a comprehensive risk management framework.
        
        1.1.2 Data Protection
        Personal data must be protected according to applicable privacy regulations.
        
        Section 2.1 - Reporting Requirements
        Entities are required to submit quarterly reports.
        """
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
            f.write(test_content)
            temp_file_path = f.name
        
        try:
            with open(temp_file_path, 'rb') as f:
                files = {'file': ('test_regulation.txt', f, 'text/plain')}
                success, response = self.run_test(
                    "Document Upload",
                    "POST",
                    "documents/upload",
                    200,
                    files=files
                )
                
                if success and 'document_id' in response:
                    self.document_id = response['document_id']
                    print(f"   Document ID: {self.document_id}")
                    return True
                return False
        finally:
            os.unlink(temp_file_path)

    def test_get_documents(self):
        """Test getting all documents"""
        success, response = self.run_test(
            "Get Documents",
            "GET",
            "documents",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} documents")
            return True
        return False

    def test_get_statements(self):
        """Test getting statements for a document"""
        if not self.document_id:
            print("❌ Skipping - No document ID available")
            return False
            
        success, response = self.run_test(
            "Get Statements",
            "GET",
            f"documents/{self.document_id}/statements",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} statements")
            if len(response) > 0:
                self.statement_id = response[0]['id']
                print(f"   First statement ID: {self.statement_id}")
            return True
        return False

    def test_add_custom_column(self):
        """Test adding a custom column"""
        if not self.document_id:
            print("❌ Skipping - No document ID available")
            return False
            
        column_data = {
            "document_id": self.document_id,
            "name": "Test_Status",
            "column_type": "enum",
            "options": ["Not Started", "In Progress", "Completed"],
            "default_value": "Not Started",
            "is_visible": True,
            "order": 1
        }
        
        success, response = self.run_test(
            "Add Custom Column",
            "POST",
            "columns",
            200,
            data=column_data
        )
        
        if success and 'column_id' in response:
            self.column_id = response['column_id']
            print(f"   Column ID: {self.column_id}")
            return True
        return False

    def test_get_columns(self):
        """Test getting columns for a document"""
        if not self.document_id:
            print("❌ Skipping - No document ID available")
            return False
            
        success, response = self.run_test(
            "Get Columns",
            "GET",
            f"columns/{self.document_id}",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} columns")
            return True
        return False

    def test_update_statement(self):
        """Test updating a statement's custom fields"""
        if not self.statement_id:
            print("❌ Skipping - No statement ID available")
            return False
            
        update_data = {
            "custom_fields": {
                "Test_Status": "In Progress",
                "Notes": "Testing custom field update"
            }
        }
        
        success, response = self.run_test(
            "Update Statement",
            "PUT",
            f"statements/{self.statement_id}",
            200,
            data=update_data
        )
        return success

    def test_save_template(self):
        """Test saving a template"""
        template_data = {
            "name": "Test Template",
            "description": "Template for testing",
            "columns": [
                {
                    "name": "Priority",
                    "column_type": "enum",
                    "options": ["High", "Medium", "Low"]
                },
                {
                    "name": "Owner",
                    "column_type": "text"
                }
            ]
        }
        
        success, response = self.run_test(
            "Save Template",
            "POST",
            "templates",
            200,
            data=template_data
        )
        
        if success and 'template_id' in response:
            self.template_id = response['template_id']
            print(f"   Template ID: {self.template_id}")
            return True
        return False

    def test_get_templates(self):
        """Test getting all templates"""
        success, response = self.run_test(
            "Get Templates",
            "GET",
            "templates",
            200
        )
        
        if success and isinstance(response, list):
            print(f"   Found {len(response)} templates")
            return True
        return False

    def test_apply_template(self):
        """Test applying a template to a document"""
        if not self.template_id or not self.document_id:
            print("❌ Skipping - No template ID or document ID available")
            return False
            
        success, response = self.run_test(
            "Apply Template",
            "POST",
            f"templates/{self.template_id}/apply?document_id={self.document_id}",
            200
        )
        return success

    def test_export_csv(self):
        """Test CSV export"""
        if not self.document_id:
            print("❌ Skipping - No document ID available")
            return False
            
        success, response = self.run_test(
            "Export CSV",
            "GET",
            f"export/{self.document_id}?format=csv",
            200
        )
        return success

    def test_export_xlsx(self):
        """Test XLSX export"""
        if not self.document_id:
            print("❌ Skipping - No document ID available")
            return False
            
        success, response = self.run_test(
            "Export XLSX",
            "GET",
            f"export/{self.document_id}?format=xlsx",
            200
        )
        return success

    def test_document_preview(self):
        """Test document preview"""
        if not self.document_id:
            print("❌ Skipping - No document ID available")
            return False
            
        success, response = self.run_test(
            "Document Preview",
            "GET",
            f"documents/{self.document_id}/preview",
            200
        )
        
        if success and 'filename' in response:
            print(f"   Preview filename: {response['filename']}")
            return True
        return False

    def test_delete_column(self):
        """Test deleting a custom column"""
        if not self.column_id:
            print("❌ Skipping - No column ID available")
            return False
            
        success, response = self.run_test(
            "Delete Column",
            "DELETE",
            f"columns/{self.column_id}",
            200
        )
        return success

def main():
    print("🚀 Starting Regulation Statement Extractor API Tests")
    print("=" * 60)
    
    tester = RegulationExtractorAPITester()
    
    # Test sequence
    tests = [
        tester.test_root_endpoint,
        tester.test_document_upload,
        tester.test_get_documents,
        tester.test_get_statements,
        tester.test_add_custom_column,
        tester.test_get_columns,
        tester.test_update_statement,
        tester.test_save_template,
        tester.test_get_templates,
        tester.test_apply_template,
        tester.test_export_csv,
        tester.test_export_xlsx,
        tester.test_document_preview,
        tester.test_delete_column
    ]
    
    # Run all tests
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test failed with exception: {str(e)}")
    
    # Print results
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())