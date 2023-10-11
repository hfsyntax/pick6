if WScript.Arguments.Count < 3 Then
    WScript.Echo "Error! Please specify the source path, sheet name, and the destination. Usage: XlsToCsv SourcePath.xls SheetName Destination.csv"
    Wscript.Quit
End If

Dim sourcePath, sheetName, destinationPath
sourcePath = WScript.Arguments.Item(0)
sheetName = WScript.Arguments.Item(1)
destinationPath = WScript.Arguments.Item(2)

Dim oExcel
Set oExcel = CreateObject("Excel.Application")
Dim oBook
Set oBook = oExcel.Workbooks.Open(sourcePath)

' Check if the sheet exists
Dim sheetExists
sheetExists = False
For Each oSheet In oBook.Sheets
    If oSheet.Name = sheetName Then
        sheetExists = True
        Exit For
    End If
Next

If sheetExists Then
    oBook.Sheets(sheetName).Select
    oBook.SaveAs destinationPath, 6 ' 6 corresponds to CSV format
    oBook.Close False
    oExcel.Quit
Else
    WScript.Echo "Sheet '" & sheetName & "' does not exist in the source workbook."
End If
