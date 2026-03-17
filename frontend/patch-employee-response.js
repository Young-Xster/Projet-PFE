const fs = require('fs');

const responseFile = '../backend/grh/src/main/java/com/grh/grh/dto/response/employee/EmployeeResponse.java';
let content = fs.readFileSync(responseFile, 'utf8');

const fieldsToAdd = `
    private LocalDate dateOfBirth;
    private String gender;
    private String address;
    private String city;
    private String postalCode;
    private String country;
    private String nationalId;
`;

if (!content.includes('dateOfBirth')) {
  content = content.replace(
    'private String phoneNumber;\n',
    'private String phoneNumber;\n' + fieldsToAdd
  );
  fs.writeFileSync(responseFile, content);
}

const serviceFile = '../backend/grh/src/main/java/com/grh/grh/service/EmployeeService.java';
let serviceContent = fs.readFileSync(serviceFile, 'utf8');

const mappingToAdd = `            .dateOfBirth(employee.getDateOfBirth())
            .gender(employee.getGender())
            .address(employee.getAddress())
            .city(employee.getCity())
            .postalCode(employee.getPostalCode())
            .country(employee.getCountry())
            .nationalId(employee.getNationalId())
`;

if (!serviceContent.includes('.dateOfBirth(employee.getDateOfBirth())')) {
  serviceContent = serviceContent.replace(
    '.phoneNumber(employee.getPhoneNumber())\n',
    '.phoneNumber(employee.getPhoneNumber())\n' + mappingToAdd
  );
  fs.writeFileSync(serviceFile, serviceContent);
}

